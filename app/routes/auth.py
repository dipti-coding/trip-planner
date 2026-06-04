import hashlib
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import authenticate_user, create_access_token, verify_apple_token
from app.db import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

_REFRESH_EXPIRE_DAYS = 30


def _make_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


def _issue_tokens(user_id: uuid.UUID, db: Session) -> dict:
    """Create an access + refresh token pair for a user and persist the refresh token."""
    raw_refresh, token_hash = _make_refresh_token()
    db.add(RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=_REFRESH_EXPIRE_DAYS),
    ))
    db.commit()
    return {
        "access_token": create_access_token(str(user_id)),
        "refresh_token": raw_refresh,
        "token_type": "bearer",
    }


# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTION AUTH
# These endpoints are always active. POST /apple verifies an Apple identity
# token; POST /refresh silently issues a new access token from a refresh token.
# ══════════════════════════════════════════════════════════════════════════════

class AppleSignInRequest(BaseModel):
    identity_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/apple")
def sign_in_with_apple(body: AppleSignInRequest, db: Session = Depends(get_db)):
    try:
        claims = verify_apple_token(body.identity_token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Apple identity token")

    apple_id = claims["sub"]
    email = claims.get("email")  # absent on subsequent sign-ins when user hides email

    user = db.query(User).filter(User.apple_id == apple_id).first()
    if not user:
        user = User(apple_id=apple_id, email=email)
        db.add(user)
        db.flush()

    return _issue_tokens(user.id, db)


@router.post("/refresh")
def refresh_token(body: RefreshRequest, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(body.refresh_token.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.expires_at > datetime.now(timezone.utc),
    ).first()
    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    return {"access_token": create_access_token(str(stored.user_id)), "token_type": "bearer"}


# ══════════════════════════════════════════════════════════════════════════════
# DEV AUTH — only active when AUTH_DEV_MODE=1
# Returns 404 in production. Issues the same access + refresh token pair as the
# production flow so all auth code paths (refresh, sign-out, 401 retry) work
# identically whether testing with a real Apple account or dev credentials.
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/token")
def dev_login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if not os.getenv("AUTH_DEV_MODE"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    user = authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Upsert the dev user so the refresh token FK constraint is always satisfied,
    # even if seed.py hasn't been run yet.
    db_user = db.query(User).filter(User.email == user["email"]).first()
    if not db_user:
        db_user = User(email=user["email"])
        db.add(db_user)
        db.flush()

    return _issue_tokens(db_user.id, db)

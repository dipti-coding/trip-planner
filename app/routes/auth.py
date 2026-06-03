import hashlib
import os
import secrets
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
# Seeded dev user UUID — matches scripts/seed.py DEV_USER_ID
_DEV_USER_ID = "96a84b90-d7d7-4f6a-8691-d084deda8991"


def _make_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(32)
    return raw, hashlib.sha256(raw.encode()).hexdigest()


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

    raw_refresh, token_hash = _make_refresh_token()
    db.add(RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=_REFRESH_EXPIRE_DAYS),
    ))
    db.commit()

    return {
        "access_token": create_access_token(str(user.id)),
        "refresh_token": raw_refresh,
        "token_type": "bearer",
    }


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


@router.post("/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Dev-only endpoint — only active when AUTH_DEV_MODE=1."""
    if not os.getenv("AUTH_DEV_MODE"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    user = authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    db_user = db.query(User).filter(User.email == user["email"]).first()
    user_id = str(db_user.id) if db_user else _DEV_USER_ID
    return {"access_token": create_access_token(user_id), "token_type": "bearer"}

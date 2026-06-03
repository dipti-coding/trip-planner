import os
from datetime import datetime, timedelta, timezone

import bcrypt
import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

load_dotenv()

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_ISSUER = "https://appleid.apple.com"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _get_hardcoded_user() -> dict:
    email = os.environ["AUTH_USER_EMAIL"]
    hashed = os.environ["AUTH_USER_PASSWORD_HASH"]
    return {"email": email, "hashed_password": hashed}


def authenticate_user(email: str, password: str) -> dict | None:
    user = _get_hardcoded_user()
    if email != user["email"]:
        return None
    if not _verify_password(password, user["hashed_password"]):
        return None
    return user


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error
    return user_id


def verify_apple_token(identity_token: str) -> dict:
    """Fetch Apple's JWKS and verify an identity token. Returns the decoded claims."""
    bundle_id = os.environ["APPLE_APP_BUNDLE_ID"]
    try:
        resp = httpx.get(APPLE_JWKS_URL, timeout=10)
        resp.raise_for_status()
        jwks = resp.json()

        header = jwt.get_unverified_header(identity_token)
        kid = header.get("kid")
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if key is None:
            raise ValueError("No matching Apple public key found")

        return jwt.decode(
            identity_token,
            key,
            algorithms=["RS256"],
            audience=bundle_id,
            issuer=APPLE_ISSUER,
        )
    except JWTError as exc:
        raise ValueError(str(exc)) from exc

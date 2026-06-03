import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from app.models.refresh_token import RefreshToken
from app.models.user import User
from tests.conftest import TestingSessionLocal, engine


@pytest.fixture
def auth_client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _apple_claims(apple_sub: str, email: str | None = "user@example.com") -> dict:
    return {"sub": apple_sub, "email": email, "email_verified": True}


def _sign_in(client, claims: dict):
    with patch("app.routes.auth.verify_apple_token", return_value=claims):
        return client.post("/auth/apple", json={"identity_token": "fake.token.here"})


# --- Sign in with Apple ---

def test_new_user_created_on_first_sign_in(auth_client, db):
    apple_sub = str(uuid.uuid4())
    resp = _sign_in(auth_client, _apple_claims(apple_sub))

    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    user = db.query(User).filter(User.apple_id == apple_sub).first()
    assert user is not None
    assert user.email == "user@example.com"


def test_returning_user_not_duplicated(auth_client, db):
    apple_sub = str(uuid.uuid4())
    _sign_in(auth_client, _apple_claims(apple_sub))
    _sign_in(auth_client, _apple_claims(apple_sub))

    count = db.query(User).filter(User.apple_id == apple_sub).count()
    assert count == 1


def test_hidden_email_path(auth_client, db):
    apple_sub = str(uuid.uuid4())
    relay = f"{uuid.uuid4()}@privaterelay.appleid.com"
    resp = _sign_in(auth_client, _apple_claims(apple_sub, email=relay))

    assert resp.status_code == 200
    user = db.query(User).filter(User.apple_id == apple_sub).first()
    assert user.email == relay


def test_subsequent_sign_in_without_email(auth_client, db):
    apple_sub = str(uuid.uuid4())
    _sign_in(auth_client, _apple_claims(apple_sub, email="first@example.com"))
    # Subsequent Apple sign-ins may omit email
    resp = _sign_in(auth_client, _apple_claims(apple_sub, email=None))

    assert resp.status_code == 200
    count = db.query(User).filter(User.apple_id == apple_sub).count()
    assert count == 1


def test_invalid_apple_token_returns_401(auth_client):
    with patch("app.routes.auth.verify_apple_token", side_effect=ValueError("bad token")):
        resp = auth_client.post("/auth/apple", json={"identity_token": "bad"})
    assert resp.status_code == 401


# --- Refresh tokens ---

def test_refresh_returns_new_access_token(auth_client, db):
    apple_sub = str(uuid.uuid4())
    sign_in_resp = _sign_in(auth_client, _apple_claims(apple_sub))
    raw_refresh = sign_in_resp.json()["refresh_token"]

    resp = auth_client.post("/auth/refresh", json={"refresh_token": raw_refresh})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_expired_refresh_token_rejected(auth_client, db):
    apple_sub = str(uuid.uuid4())
    sign_in_resp = _sign_in(auth_client, _apple_claims(apple_sub))
    raw_refresh = sign_in_resp.json()["refresh_token"]

    # Manually expire the token in the DB
    token_hash = hashlib.sha256(raw_refresh.encode()).hexdigest()
    stored = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    stored.expires_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.flush()

    resp = auth_client.post("/auth/refresh", json={"refresh_token": raw_refresh})
    assert resp.status_code == 401


def test_invalid_refresh_token_rejected(auth_client):
    resp = auth_client.post("/auth/refresh", json={"refresh_token": "not-a-real-token"})
    assert resp.status_code == 401


# --- Dev /auth/token gating ---

def test_dev_token_endpoint_unavailable_without_flag(auth_client, monkeypatch):
    monkeypatch.delenv("AUTH_DEV_MODE", raising=False)
    resp = auth_client.post("/auth/token", data={"username": "a@b.com", "password": "x"})
    assert resp.status_code == 404

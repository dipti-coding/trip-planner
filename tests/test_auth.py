import os

import pytest
from fastapi.testclient import TestClient

from app.db import get_db
from app.main import app
from tests.conftest import TestingSessionLocal, engine


@pytest.fixture
def auth_client(db):
    # No get_current_user override — exercises real token validation
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _login(client, password=None):
    return client.post("/auth/token", data={
        "username": os.environ["AUTH_USER_EMAIL"],
        "password": password or os.environ["AUTH_USER_PWD"],
    })


def test_login_returns_token(auth_client):
    resp = _login(auth_client)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(auth_client):
    resp = _login(auth_client, password="wrongpassword")
    assert resp.status_code == 401


def test_login_wrong_email(auth_client):
    resp = auth_client.post("/auth/token", data={
        "username": "nobody@example.com",
        "password": "REDACTED",
    })
    assert resp.status_code == 401


def test_protected_route_requires_token(auth_client):
    resp = auth_client.get("/trips")
    assert resp.status_code == 401


def test_protected_route_accepts_valid_token(auth_client):
    token = _login(auth_client).json()["access_token"]
    resp = auth_client.get("/trips", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


def test_protected_route_rejects_bad_token(auth_client):
    resp = auth_client.get("/trips", headers={"Authorization": "Bearer notavalidtoken"})
    assert resp.status_code == 401

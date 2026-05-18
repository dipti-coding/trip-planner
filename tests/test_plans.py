import uuid


def test_delete_plan(client, user):
    trip = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Tokyo Trip",
        "destination_city": "Tokyo, Japan",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
    }).json()

    plan = client.post(f"/trips/{trip['id']}/plans", json={
        "type": "Activity",
        "title": "Shibuya Crossing",
        "details": {},
    }).json()

    resp = client.delete(f"/plans/{plan['id']}")
    assert resp.status_code == 204

    plans = client.get(f"/trips/{trip['id']}/plans").json()
    assert all(p["id"] != plan["id"] for p in plans)


def test_delete_plan_not_found(client):
    resp = client.delete(f"/plans/{uuid.uuid4()}")
    assert resp.status_code == 404

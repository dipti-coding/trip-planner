import uuid


def test_create_flight_plan(client, user):
    trip = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Tokyo Trip",
        "destination_city": "Tokyo, Japan",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
    }).json()

    resp = client.post(f"/trips/{trip['id']}/plans", json={
        "type": "Flight",
        "title": "SFO → NRT",
        "start_datetime": "2026-06-01T10:00:00Z",
        "end_datetime": "2026-06-02T14:00:00Z",
        "details": {
            "airline": "United",
            "flight_number": "UA 837",
            "departure_airport": "SFO",
            "arrival_airport": "NRT",
        },
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Flight"
    assert data["details"]["airline"] == "United"
    assert data["details"]["flight_number"] == "UA 837"


def test_create_hotel_plan(client, user):
    trip = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Tokyo Trip",
        "destination_city": "Tokyo, Japan",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
    }).json()

    resp = client.post(f"/trips/{trip['id']}/plans", json={
        "type": "Hotel",
        "title": "Shinjuku Granbell Hotel",
        "start_datetime": "2026-06-02T15:00:00Z",
        "end_datetime": "2026-06-10T11:00:00Z",
        "details": {"room_type": "Deluxe Twin", "confirmation": "HTL123"},
    })
    assert resp.status_code == 201
    assert resp.json()["details"]["room_type"] == "Deluxe Twin"


def test_create_plan_no_details(client, user):
    trip = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Tokyo Trip",
        "destination_city": "Tokyo, Japan",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
    }).json()

    resp = client.post(f"/trips/{trip['id']}/plans", json={
        "type": "Activity",
        "title": "Shibuya Crossing",
    })
    assert resp.status_code == 201
    assert resp.json()["details"] == {}


def test_create_plan_invalid_details(client, user):
    trip = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Tokyo Trip",
        "destination_city": "Tokyo, Japan",
        "start_date": "2026-06-01",
        "end_date": "2026-06-10",
    }).json()

    # party_size must be int, not string
    resp = client.post(f"/trips/{trip['id']}/plans", json={
        "type": "Restaurant",
        "title": "Dinner",
        "details": {"party_size": "two"},
    })
    assert resp.status_code == 422


def test_create_plan_trip_not_found(client):
    resp = client.post(f"/trips/{uuid.uuid4()}/plans", json={
        "type": "Activity",
        "title": "Hike",
        "details": {},
    })
    assert resp.status_code == 404


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

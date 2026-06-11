def _make_trip(client, user):
    return client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Paris Spring",
        "destination_city": "Paris, France",
        "start_date": "2026-04-01",
        "end_date": "2026-04-10",
    })


def test_create_trip(client, user):
    resp = _make_trip(client, user)
    data = resp.json()
    assert resp.status_code == 201
    assert data["name"] == "Paris Spring"
    assert data["destination_city"] == "Paris, France"
    assert data["user_id"] == str(user.id)


def test_delete_trip(client, user):
    trip = _make_trip(client, user).json()
    trip_id = trip["id"]

    client.post(f"/trips/{trip_id}/plans", json={
        "type": "Hotel",
        "title": "Hotel du Louvre",
        "start_datetime": "2026-04-01T15:00:00Z",
        "end_datetime": "2026-04-10T11:00:00Z",
        "details": {"room_type": "Double"},
    })

    resp = client.delete(f"/trips/{trip_id}")
    assert resp.status_code == 204

    assert client.get(f"/trips/{trip_id}").status_code == 404
    assert client.get(f"/trips/{trip_id}/plans").status_code == 404


def test_delete_trip_cascades_plans(client, user):
    trip = _make_trip(client, user).json()
    trip_id = trip["id"]

    plan_ids = []
    for title, ptype, details in [
        ("SFO → CDG", "Flight", {"airline": "Air France", "flight_number": "AF 083", "departure_airport": "SFO", "arrival_airport": "CDG"}),
        ("Hotel du Louvre", "Hotel", {"room_type": "Double"}),
    ]:
        plan = client.post(f"/trips/{trip_id}/plans", json={
            "type": ptype,
            "title": title,
            "start_datetime": "2026-04-01T15:00:00Z",
            "end_datetime": "2026-04-10T11:00:00Z",
            "details": details,
        }).json()
        plan_ids.append(plan["id"])

    assert client.delete(f"/trips/{trip_id}").status_code == 204

    for plan_id in plan_ids:
        assert client.delete(f"/plans/{plan_id}").status_code == 404


def test_delete_trip_not_found(client):
    resp = client.delete("/trips/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


def test_update_trip(client, user):
    trip = _make_trip(client, user).json()
    trip_id = trip["id"]

    resp = client.patch(f"/trips/{trip_id}", json={"name": "Paris Autumn", "end_date": "2026-04-15"})
    data = resp.json()
    assert resp.status_code == 200
    assert data["name"] == "Paris Autumn"
    assert data["end_date"] == "2026-04-15"
    assert data["destination_city"] == "Paris, France"  # unchanged


def test_update_trip_not_found(client):
    resp = client.patch("/trips/00000000-0000-0000-0000-000000000000", json={"name": "Ghost"})
    assert resp.status_code == 404

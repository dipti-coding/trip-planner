import uuid
from unittest.mock import patch


def test_create_flight_plan(client, user):
    trip = _make_trip(client, user)
    data = _make_flight_plan(client, trip["id"])
    assert data["type"] == "Flight"
    assert data["details"]["airline"] == "United"
    assert data["details"]["flight_number"] == "UA 837"


def test_create_hotel_plan(client, user):
    trip = _make_trip(client, user)
    data = _make_hotel_plan(client, trip["id"])
    assert data["type"] == "Hotel"
    assert data["details"]["room_type"] == "Double"


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


def test_from_parsed_creates_flight_plan(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/from-parsed", json={
        "type": "Flight",
        "title": "DL 405 SFO → JFK",
        "start_datetime": "2026-06-01T08:00:00",
        "details": {"airline": "Delta", "flight_number": "DL 405", "departure_airport": "SFO", "arrival_airport": "JFK"},
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Flight"
    assert data["details"]["flight_number"] == "DL 405"


def test_from_parsed_date_outside_trip_range(client, user):
    trip = _make_trip(client, user)
    with patch.dict("os.environ", {"PARSE_TEST_MODE": ""}):
        resp = client.post(f"/trips/{trip['id']}/plans/from-parsed", json={
            "type": "Flight",
            "title": "DL 100 SFO → JFK",
            "start_datetime": "2025-11-08T09:25:00",
            "details": {},
        })
    assert resp.status_code == 422
    assert "outside this trip" in resp.json()["detail"]


def test_from_parsed_test_mode_clamps_out_of_range_date(client, user):
    # Trip runs June 1–30 2026; parsed date is Nov 2025 (way outside).
    # PARSE_TEST_MODE=1 should succeed and clamp to the trip's start date,
    # preserving the original time-of-day.
    trip = _make_trip(client, user)
    with patch.dict("os.environ", {"PARSE_TEST_MODE": "1"}):
        resp = client.post(f"/trips/{trip['id']}/plans/from-parsed", json={
            "type": "Flight",
            "title": "DL 100 SFO → JFK",
            "start_datetime": "2025-11-08T09:25:00",
            "details": {},
        })
    assert resp.status_code == 201
    data = resp.json()
    assert data["start_datetime"].startswith("2026-06-01"), (
        "date should be clamped to trip start date"
    )
    assert "09:25:00" in data["start_datetime"], (
        "time-of-day should be preserved from the parsed date"
    )


def test_from_parsed_trip_not_found(client):
    resp = client.post(f"/trips/{uuid.uuid4()}/plans/from-parsed", json={
        "type": "Flight",
        "title": "Any flight",
        "details": {},
    })
    assert resp.status_code == 404


def test_bulk_create_round_trip_flight(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/from-parsed-bulk", json=[
        {
            "type": "Flight",
            "title": "AA0271 LAX → OGG",
            "start_datetime": "2026-06-16T08:00:00",
            "details": {"airline": "American", "flight_number": "AA0271", "departure_airport": "LAX", "arrival_airport": "OGG"},
        },
        {
            "type": "Flight",
            "title": "AA0254 OGG → LAX",
            "start_datetime": "2026-06-17T10:00:00",
            "details": {"airline": "American", "flight_number": "AA0254", "departure_airport": "OGG", "arrival_airport": "LAX"},
        },
    ])
    assert resp.status_code == 201
    data = resp.json()
    assert len(data) == 2
    assert data[0]["details"]["flight_number"] == "AA0271"
    assert data[1]["details"]["flight_number"] == "AA0254"


def test_bulk_create_single_flight(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/from-parsed-bulk", json=[
        {
            "type": "Flight",
            "title": "UA 837 SFO → NRT",
            "start_datetime": "2026-06-01T10:00:00",
            "details": {"airline": "United", "flight_number": "UA 837"},
        },
    ])
    assert resp.status_code == 201
    assert len(resp.json()) == 1


def test_bulk_create_date_outside_range(client, user):
    trip = _make_trip(client, user)
    with patch.dict("os.environ", {"PARSE_TEST_MODE": ""}):
        resp = client.post(f"/trips/{trip['id']}/plans/from-parsed-bulk", json=[
            {
                "type": "Flight",
                "title": "AA0271 LAX → OGG",
                "start_datetime": "2026-06-16T08:00:00",
                "details": {},
            },
            {
                "type": "Flight",
                "title": "Out of range leg",
                "start_datetime": "2025-01-01T08:00:00",
                "details": {},
            },
        ])
    assert resp.status_code == 422
    plans = client.get(f"/trips/{trip['id']}/plans").json()
    assert len(plans) == 0


def test_bulk_create_trip_not_found(client):
    resp = client.post(f"/trips/{uuid.uuid4()}/plans/from-parsed-bulk", json=[
        {"type": "Flight", "title": "Any", "details": {}},
    ])
    assert resp.status_code == 404


def test_get_plan(client, user):
    trip = _make_trip(client, user)
    plan = _make_hotel_plan(client, trip["id"])

    resp = client.get(f"/plans/{plan['id']}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == plan["id"]
    assert data["type"] == "Hotel"
    assert data["title"] == "Shinjuku Granbell"
    assert data["details"]["room_type"] == "Double"


def test_get_plan_not_found(client):
    resp = client.get(f"/plans/{uuid.uuid4()}")
    assert resp.status_code == 404


def test_update_plan_title_and_datetime(client, user):
    trip = _make_trip(client, user)
    plan = _make_flight_plan(client, trip["id"])

    resp = client.patch(f"/plans/{plan['id']}", json={
        "title": "SFO → HND",
        "start_datetime": "2026-06-02T10:00:00Z",
    })
    data = resp.json()
    assert resp.status_code == 200
    assert data["title"] == "SFO → HND"
    assert "2026-06-02" in data["start_datetime"]
    assert data["details"]["flight_number"] == "UA 837"  # unchanged


def test_update_plan_details_partial(client, user):
    trip = _make_trip(client, user)
    plan = _make_flight_plan(client, trip["id"])

    resp = client.patch(f"/plans/{plan['id']}", json={
        "details": {"seat": "12A", "gate": "B22"},
    })
    data = resp.json()
    assert resp.status_code == 200
    assert data["details"]["seat"] == "12A"
    assert data["details"]["gate"] == "B22"
    assert data["details"]["airline"] == "United"       # existing field preserved
    assert data["details"]["flight_number"] == "UA 837" # existing field preserved


def test_update_plan_details_invalid(client, user):
    trip = _make_trip(client, user)
    plan = _make_hotel_plan(client, trip["id"])

    resp = client.patch(f"/plans/{plan['id']}", json={"details": "bad"})
    assert resp.status_code == 422


def test_update_plan_not_found(client):
    resp = client.patch(f"/plans/{uuid.uuid4()}", json={"title": "Ghost"})
    assert resp.status_code == 404


# ---------- Private common helper functions
def _make_trip(client, user):
    return client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Test Trip",
        "destination_city": "Anywhere",
        "start_date": "2026-06-01",
        "end_date": "2026-06-30",
    }).json()


def _make_hotel_plan(client, trip_id):
    return client.post(f"/trips/{trip_id}/plans", json={
        "type": "Hotel",
        "title": "Shinjuku Granbell",
        "start_datetime": "2026-06-01T15:00:00Z",
        "end_datetime": "2026-06-10T11:00:00Z",
        "details": {"room_type": "Double"},
    }).json()


def _make_flight_plan(client, trip_id):
    return client.post(f"/trips/{trip_id}/plans", json={
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
    }).json()


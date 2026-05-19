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


# ── parse-and-create tests ────────────────────────────────────────────────────

def _make_trip(client, user):
    return client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Test Trip",
        "destination_city": "Anywhere",
        "start_date": "2026-06-01",
        "end_date": "2026-06-30",
    }).json()


def test_parse_flight(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Your flight DL 405 departs from SFO on June 1, 2026 and arrives at JFK. "
            "Airline: Delta. Seat: 12A. Gate: B22. Confirmation: ABCDEF."
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Flight"
    assert data["details"].get("flight_number") == "DL 405"


def test_parse_hotel(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Grand Hyatt Hotel\n"
            "Check-in: June 2, 2026\nCheck-out: June 5, 2026\n"
            "Room: King Suite\nConfirmation: HTLXYZ89"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Hotel"
    assert data["details"].get("confirmation") == "HTLXYZ89"


def test_parse_car_reservation(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Enterprise Car Rental\n"
            "Pickup location: LAX Airport\nDropoff location: Downtown LA\n"
            "Car type: Compact\nConfirmation: CARZZ123\nJuly 1, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "CarReservation"
    assert data["details"].get("rental_company") == "Enterprise"


def test_parse_tour(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Tokyo City Tour\n"
            "Tour operator: JTB Travel\nConfirmation: TOURAA99\n"
            "Meeting point: Shinjuku Station East Exit\nGroup size: 12 guests\nJune 5, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Tour"
    assert data["details"].get("confirmation") == "TOURAA99"


def test_parse_cruise(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Royal Caribbean Cruise Confirmation\n"
            "Ship: Symphony of the Seas\nCabin: 8124\nCabin class: Balcony\n"
            "Port of departure: Miami, FL\nEmbarkation: June 10, 2026\nConfirmation: CRUIS123"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Cruise"
    assert data["details"].get("cruise_line") == "Royal Caribbean"


def test_parse_ferry(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Ferry Crossing Confirmation\n"
            "Departure port: Dover, UK\nArrival port: Calais, France\n"
            "Vessel: MS Pride of Kent\nConfirmation: FRY5678\nJune 15, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "Ferry"
    assert data["details"].get("confirmation") == "FRY5678"


def test_parse_railway(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Amtrak Train Reservation\n"
            "Departs from station: New York Penn Station\n"
            "Arrives at station: Washington DC Union Station\n"
            "Seat: 14C\nConfirmation: AMTK123\nJune 20, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "RailwayRide"
    assert data["details"].get("operator") == "Amtrak"


def test_parse_bus(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "Greyhound Bus Ticket\n"
            "Departs from terminal: New York Port Authority\n"
            "Drop-off at terminal: Philadelphia Bus Terminal\n"
            "Seat: 15A\nConfirmation: BUS43210\nJuly 1, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "BusRide"
    assert data["details"].get("operator") == "Greyhound"


def test_parse_local_event(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": (
            "TAYLOR SWIFT - THE ERAS TOUR\n"
            "Venue: SoFi Stadium\nSeat: Section 101 Row E Seat 12\n"
            "Order: TSWFT9876\nAugust 3, 2026"
        )
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "LocalEvent"
    assert data["details"].get("venue") is not None


def test_parse_unrecognized_text(client, user):
    trip = _make_trip(client, user)
    resp = client.post(f"/trips/{trip['id']}/plans/parse-and-create", json={
        "raw_text": "This is just some random text with no travel information at all."
    })
    assert resp.status_code == 422


def test_parse_trip_not_found(client):
    resp = client.post(f"/trips/{uuid.uuid4()}/plans/parse-and-create", json={
        "raw_text": "Your flight DL 405 departs SFO. Confirmation: ABCDEF."
    })
    assert resp.status_code == 404

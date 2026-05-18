def test_create_trip(client, user):
    resp = client.post("/trips", json={
        "user_id": str(user.id),
        "name": "Paris Spring",
        "destination_city": "Paris, France",
        "start_date": "2026-04-01",
        "end_date": "2026-04-10",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Paris Spring"
    assert data["destination_city"] == "Paris, France"
    assert data["user_id"] == str(user.id)

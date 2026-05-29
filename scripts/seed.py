"""Seed the local database with test users, trips, and plans."""
import sys
import os
import uuid

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from datetime import date, datetime, timezone

from app.db import SessionLocal
from app.models import Plan, Trip, User
from app.models.plan import PlanType

DEV_USER_ID = uuid.UUID("96a84b90-d7d7-4f6a-8691-d084deda8991")


def seed() -> None:
    db = SessionLocal()
    try:
        # Clear existing seed data
        db.query(Plan).delete()
        db.query(Trip).delete()
        db.query(User).delete()

        # --- User ---
        user = User(
            id=DEV_USER_ID,
            email="traveler@example.com",
            home_city="San Francisco",
            activity_preferences=["hiking", "food", "culture"],
        )
        db.add(user)
        db.flush()

        # --- Trip ---
        trip = Trip(
            user_id=user.id,
            name="Tokyo Summer 2026",
            destination_city="Tokyo, Japan",
            start_date=date(2026, 6, 15),
            end_date=date(2026, 6, 22),
        )
        db.add(trip)
        db.flush()

        # --- Plans ---
        plans = [
            Plan(
                trip_id=trip.id,
                type=PlanType.Flight,
                title="SFO → NRT — United UA 837",
                start_datetime=datetime(2026, 6, 15, 10, 30, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 16, 14, 45, tzinfo=timezone.utc),
                details={
                    "airline": "United",
                    "flight_number": "UA 837",
                    "seat": "14A",
                    "confirmation": "XYZABC",
                    "departure_airport": "SFO",
                    "arrival_airport": "NRT",
                    "cabin_class": "Economy",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.Hotel,
                title="Shinjuku Granbell Hotel",
                start_datetime=datetime(2026, 6, 16, 15, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 22, 11, 0, tzinfo=timezone.utc),
                details={
                    "confirmation": "HTL99123",
                    "room_type": "Deluxe Twin",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.Activity,
                title="Shibuya Crossing & Harajuku",
                start_datetime=datetime(2026, 6, 17, 10, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 17, 14, 0, tzinfo=timezone.utc),
                details={
                    "location": "Shibuya, Tokyo",
                    "notes": "Meet guide at Hachiko statue",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.Restaurant,
                title="Dinner at Sukiyabashi Jiro",
                start_datetime=datetime(2026, 6, 17, 19, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 17, 21, 0, tzinfo=timezone.utc),
                details={
                    "reservation_name": "traveler@example.com",
                    "party_size": 2,
                    "confirmation": "JIRO2026",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.RailwayRide,
                title="Shinkansen Tokyo → Kyoto",
                start_datetime=datetime(2026, 6, 19, 9, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 19, 11, 15, tzinfo=timezone.utc),
                details={
                    "operator": "JR East",
                    "train_number": "Nozomi 15",
                    "departure_station": "Tokyo Station",
                    "arrival_station": "Kyoto Station",
                    "seat": "5C",
                    "cabin_class": "First",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.Tour,
                title="Tsukiji Market Food Tour",
                start_datetime=datetime(2026, 6, 18, 7, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 18, 10, 0, tzinfo=timezone.utc),
                details={
                    "operator": "Tokyo Food Tours",
                    "confirmation": "TFT8821",
                    "meeting_point": "Tsukiji Outer Market main entrance",
                    "group_size": 8,
                    "includes": ["breakfast", "tasting samples", "guided walk"],
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.LocalEvent,
                title="Sumo Tournament — Ryogoku Kokugikan",
                start_datetime=datetime(2026, 6, 20, 14, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 20, 18, 0, tzinfo=timezone.utc),
                details={
                    "venue": "Ryogoku Kokugikan",
                    "confirmation": "SUMO456",
                    "seat": "East Block Row 5",
                    "event_type": "Sports",
                },
            ),
            Plan(
                trip_id=trip.id,
                type=PlanType.CarReservation,
                title="Rental Car — Kyoto Day Trip",
                start_datetime=datetime(2026, 6, 21, 8, 0, tzinfo=timezone.utc),
                end_datetime=datetime(2026, 6, 21, 20, 0, tzinfo=timezone.utc),
                details={
                    "rental_company": "Toyota Rent a Car",
                    "confirmation": "TRC44512",
                    "car_type": "Compact",
                    "pickup_location": "Kyoto Station East Exit",
                    "dropoff_location": "Kyoto Station East Exit",
                },
            ),
        ]

        db.add_all(plans)
        db.commit()

        print(f"✓ User:  {user.email} (id: {user.id})")
        print(f"✓ Trip:  {trip.name} (id: {trip.id})")
        print(f"✓ Plans: {len(plans)} seeded")
        for p in plans:
            print(f"    - [{p.type.value}] {p.title}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

from collections import defaultdict
from datetime import date, datetime, time, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Plan, Trip
from app.schemas.trip import TripCreate, TripResponse, TripUpdate

router = APIRouter(prefix="/trips", tags=["trips"])

_DAY_OPEN = time(8, 0)    # 8 am
_DAY_CLOSE = time(22, 0)  # 10 pm
_DAY_MINUTES = 14 * 60    # minutes in a planning day
_BUFFER = timedelta(hours=1)
_DEFAULT_DURATION = timedelta(hours=1)


def _percent_planned(plans: list[Plan], start_date: date, end_date: date) -> int:
    """Coverage of waking hours (8am–10pm) by plans + 1hr buffer on each side."""
    raw: list[tuple[datetime, datetime]] = []
    for p in plans:
        if not p.start_datetime:
            continue
        ps = p.start_datetime.replace(tzinfo=None)
        pe = (p.end_datetime.replace(tzinfo=None) if p.end_datetime else ps + _DEFAULT_DURATION)
        raw.append((ps - _BUFFER, pe + _BUFFER))

    if not raw:
        return 0

    raw.sort()
    merged: list[list[datetime]] = [list(raw[0])]
    for s, e in raw[1:]:
        if s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])

    covered = 0.0
    day = start_date
    while day <= end_date:
        day_open = datetime.combine(day, _DAY_OPEN)
        day_close = datetime.combine(day, _DAY_CLOSE)
        for s, e in merged:
            overlap_start = max(s, day_open)
            overlap_end = min(e, day_close)
            if overlap_start < overlap_end:
                covered += (overlap_end - overlap_start).total_seconds() / 60
        day += timedelta(days=1)

    total = ((end_date - start_date).days + 1) * _DAY_MINUTES
    return min(100, round(covered / total * 100))


def _build_response(trip: Trip, plans: list[Plan]) -> TripResponse:
    r = TripResponse.model_validate(trip)
    r.plan_count = len(plans)
    r.scheduled_count = sum(1 for p in plans if p.start_datetime)
    r.percent_planned = _percent_planned(plans, trip.start_date, trip.end_date)
    return r


@router.post("", response_model=TripResponse, status_code=201)
def create_trip(body: TripCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trip = Trip(**body.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trips = db.query(Trip).order_by(Trip.start_date.asc()).all()
    if not trips:
        return []
    plans = db.query(Plan).filter(Plan.trip_id.in_([t.id for t in trips])).all()
    by_trip: dict[UUID, list[Plan]] = defaultdict(list)
    for p in plans:
        by_trip[p.trip_id].append(p)
    return [_build_response(trip, by_trip[trip.id]) for trip in trips]


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: UUID, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    plans = db.query(Plan).filter(Plan.trip_id == trip_id).all()
    return _build_response(trip, plans)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(trip_id: UUID, body: TripUpdate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    plans = db.query(Plan).filter(Plan.trip_id == trip_id).all()
    return _build_response(trip, plans)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(trip_id: UUID, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    db.query(Plan).filter(Plan.trip_id == trip_id).delete()
    db.delete(trip)
    db.commit()

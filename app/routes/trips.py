from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Plan, Trip
from app.schemas.plan import PlanResponse
from app.schemas.trip import TripResponse

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=list[TripResponse])
def get_trips(db: Session = Depends(get_db)):
    return db.query(Trip).order_by(Trip.start_date.asc()).all()


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(trip_id: UUID, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.get("/{trip_id}/plans", response_model=list[PlanResponse])
def get_trip_plans(trip_id: UUID, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return (
        db.query(Plan)
        .filter(Plan.trip_id == trip_id)
        .order_by(Plan.start_datetime.asc())
        .all()
    )

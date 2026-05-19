from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Plan, Trip
from app.schemas.plan import PLAN_DETAILS_SCHEMA, PlanCreate, PlanResponse

router = APIRouter(tags=["plans"])


@router.get("/trips/{trip_id}/plans", response_model=list[PlanResponse])
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


@router.post("/trips/{trip_id}/plans", response_model=PlanResponse, status_code=201)
def create_plan(trip_id: UUID, body: PlanCreate, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    details_schema = PLAN_DETAILS_SCHEMA[body.type]
    try:
        validated_details = details_schema(**body.details).model_dump(exclude_none=True)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    plan = Plan(
        trip_id=trip_id,
        type=body.type,
        title=body.title,
        start_datetime=body.start_datetime,
        end_datetime=body.end_datetime,
        details=validated_details,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: UUID, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Plan, Trip
from app.schemas.plan import PLAN_DETAILS_SCHEMA, ParseAndCreateRequest, PlanCreate, PlanResponse
from app.services.parsing import parse_confirmation_text

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


@router.post("/trips/{trip_id}/plans/parse-and-create", response_model=PlanResponse, status_code=201)
def parse_and_create_plan(trip_id: UUID, body: ParseAndCreateRequest, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    try:
        plan_type, title, start_dt, end_dt, details = parse_confirmation_text(body.raw_text)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if start_dt and not (trip.start_date <= start_dt.date() <= trip.end_date):
        raise HTTPException(
            status_code=422,
            detail=(
                f"Plan date {start_dt.strftime('%b %-d, %Y')} is outside this trip's dates "
                f"({trip.start_date.strftime('%b %-d')} – {trip.end_date.strftime('%b %-d, %Y')})"
            ),
        )

    details_schema = PLAN_DETAILS_SCHEMA[plan_type]
    validated_details = details_schema(**details).model_dump(exclude_none=True)

    plan = Plan(
        trip_id=trip_id,
        type=plan_type,
        title=title,
        start_datetime=start_dt,
        end_datetime=end_dt,
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

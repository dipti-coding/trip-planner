import logging
import os
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import Plan, Trip
from app.schemas.plan import PLAN_DETAILS_SCHEMA, PlanCreate, PlanResponse, PlanUpdate

router = APIRouter(tags=["plans"])


@router.get("/trips/{trip_id}/plans", response_model=list[PlanResponse])
def get_trip_plans(trip_id: UUID, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
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
def create_plan(trip_id: UUID, body: PlanCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
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



def _build_plan(trip, body: PlanCreate, test_mode: bool) -> Plan:
    if test_mode and not body.start_datetime:
        logging.warning(
            "[PARSE_TEST_MODE] No date parsed; defaulting to trip start date %s.",
            trip.start_date.strftime("%b %-d, %Y"),
        )
        body = body.model_copy(update={"start_datetime": datetime.combine(trip.start_date, datetime.min.time())})

    if body.start_datetime and not (trip.start_date <= body.start_datetime.date() <= trip.end_date):
        if test_mode:
            logging.warning(
                "[PARSE_TEST_MODE] Parsed date %s is outside trip %s–%s; using trip start date instead.",
                body.start_datetime.strftime("%b %-d, %Y"),
                trip.start_date.strftime("%b %-d"),
                trip.end_date.strftime("%b %-d, %Y"),
            )
            body = body.model_copy(update={
                "start_datetime": datetime.combine(trip.start_date, body.start_datetime.time()),
                "end_datetime": (
                    datetime.combine(trip.start_date, body.end_datetime.time())
                    if body.end_datetime else None
                ),
            })
        else:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Plan date {body.start_datetime.strftime('%b %-d, %Y')} is outside this trip's dates "
                    f"({trip.start_date.strftime('%b %-d')} – {trip.end_date.strftime('%b %-d, %Y')})"
                ),
            )

    details_schema = PLAN_DETAILS_SCHEMA[body.type]
    try:
        validated_details = details_schema(**body.details).model_dump(exclude_none=True)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    return Plan(
        trip_id=trip.id,
        type=body.type,
        title=body.title,
        start_datetime=body.start_datetime,
        end_datetime=body.end_datetime,
        details=validated_details,
    )


@router.post("/trips/{trip_id}/plans/from-parsed", response_model=PlanResponse, status_code=201)
def create_plan_from_parsed(trip_id: UUID, body: PlanCreate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    test_mode = os.getenv("PARSE_TEST_MODE", "").strip() == "1"
    plan = _build_plan(trip, body, test_mode)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


_MAX_PARSED_PLANS = 5

@router.post("/trips/{trip_id}/plans/from-parsed-bulk", response_model=list[PlanResponse], status_code=201)
def create_plans_from_parsed_bulk(trip_id: UUID, body: list[PlanCreate], db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    if not body:
        raise HTTPException(status_code=422, detail="No plans provided")
    if len(body) > _MAX_PARSED_PLANS:
        raise HTTPException(
            status_code=422,
            detail=f"A single screenshot should not produce more than {_MAX_PARSED_PLANS} plans (got {len(body)}). Try cropping to a single booking.",
        )
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    test_mode = os.getenv("PARSE_TEST_MODE", "").strip() == "1"
    plans = [_build_plan(trip, item, test_mode) for item in body]
    db.add_all(plans)
    db.commit()
    for p in plans:
        db.refresh(p)
    return plans


@router.get("/plans/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: UUID, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


@router.patch("/plans/{plan_id}", response_model=PlanResponse)
def update_plan(plan_id: UUID, body: PlanUpdate, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    updates = body.model_dump(exclude_unset=True)
    if "details" in updates:
        merged = {**plan.details, **updates.pop("details")}
        details_schema = PLAN_DETAILS_SCHEMA[plan.type]
        try:
            plan.details = details_schema(**merged).model_dump(exclude_none=True)
        except ValidationError as e:
            raise HTTPException(status_code=422, detail=e.errors())
    for field, value in updates.items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: UUID, db: Session = Depends(get_db), _: str = Depends(get_current_user)):
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.plan import PlanType


class PlanCreate(BaseModel):
    type: PlanType
    title: str
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    details: dict = {}


from app.schemas.plan_details import (
    ActivityDetails,
    RestaurantDetails,
    MeetingDetails,
    FlightDetails,
    HotelDetails,
    CarReservationDetails,
    CruiseDetails,
    FerryDetails,
    RailwayRideDetails,
    BusRideDetails,
)

# Maps each PlanType to its details schema for validation and parsing
PLAN_DETAILS_SCHEMA = {
    PlanType.Activity: ActivityDetails,
    PlanType.Restaurant: RestaurantDetails,
    PlanType.Meeting: MeetingDetails,
    PlanType.Flight: FlightDetails,
    PlanType.Hotel: HotelDetails,
    PlanType.CarReservation: CarReservationDetails,
    PlanType.Cruise: CruiseDetails,
    PlanType.Ferry: FerryDetails,
    PlanType.RailwayRide: RailwayRideDetails,
    PlanType.BusRide: BusRideDetails,
}


class PlanUpdate(BaseModel):
    title: str | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    details: dict = {}


class PlanResponse(BaseModel):
    id: UUID
    trip_id: UUID
    type: PlanType
    title: str
    start_datetime: datetime | None
    end_datetime: datetime | None
    details: dict
    created_at: datetime

    model_config = {"from_attributes": True}

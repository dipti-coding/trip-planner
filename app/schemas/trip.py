from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


class TripCreate(BaseModel):
    user_id: UUID  # placeholder — replaced by authenticated user in Week 4
    name: str
    destination_city: str
    start_date: date
    end_date: date


class TripResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    destination_city: str
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime
    plan_count: int = 0
    scheduled_count: int = 0
    percent_planned: int = 0

    model_config = {"from_attributes": True}

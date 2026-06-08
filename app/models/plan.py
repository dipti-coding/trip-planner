import enum
import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Enum as SAEnum, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PlanType(str, enum.Enum):
    Activity = "Activity"
    Restaurant = "Restaurant"
    Meeting = "Meeting"
    Flight = "Flight"
    Hotel = "Hotel"
    CarReservation = "CarReservation"
    Cruise = "Cruise"
    Ferry = "Ferry"
    RailwayRide = "RailwayRide"
    BusRide = "BusRide"


class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("trips.id"), nullable=False)
    type: Mapped[PlanType] = mapped_column(SAEnum(PlanType, name="plantype"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    start_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_datetime: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    details: Mapped[dict] = mapped_column(JSONB, server_default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

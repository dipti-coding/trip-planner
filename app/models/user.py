import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    home_city: Mapped[str | None] = mapped_column(String, nullable=True)
    activity_preferences: Mapped[list[str]] = mapped_column(ARRAY(String), server_default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

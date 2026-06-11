from uuid import UUID

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: UUID
    email: str | None
    home_city: str | None
    activity_preferences: list[str]

    model_config = {"from_attributes": True}

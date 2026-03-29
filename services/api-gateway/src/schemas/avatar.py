from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AvatarCreate(BaseModel):
    model_config = {"strict": True}

    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class AvatarUpdate(BaseModel):
    model_config = {"strict": True}

    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class AvatarResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    owner_id: UUID
    name: str
    description: str | None
    photo_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime


class AvatarTrainingResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    avatar_id: UUID
    status: str
    progress: int
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class AvatarListResponse(BaseModel):
    items: list[AvatarResponse]
    total: int
    page: int
    page_size: int
    pages: int

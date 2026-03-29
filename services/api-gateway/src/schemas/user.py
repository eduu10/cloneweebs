from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    model_config = {"strict": True}

    email: EmailStr
    name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    locale: str = Field(default="pt-BR", max_length=10)


class UserLogin(BaseModel):
    model_config = {"strict": True}

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    email: str
    name: str
    role: str
    locale: str
    onboarding_completed: bool
    plan: str
    created_at: datetime


class AdminUserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    email: str
    name: str
    role: str
    locale: str
    onboarding_completed: bool
    plan: str
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None


class AdminStatsResponse(BaseModel):
    total_users: int
    total_admins: int
    total_clients: int
    total_avatars: int
    total_videos: int

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ConsentCreate(BaseModel):
    model_config = {"strict": True}

    consent_type: str = Field(
        min_length=1,
        max_length=100,
        examples=["terms_of_service", "data_processing", "image_usage"],
    )
    version: str = Field(default="1.0", max_length=20)
    accepted: bool = True


class ConsentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    user_id: UUID
    consent_type: str
    version: str
    ip_address: str
    accepted: bool
    created_at: datetime

"""Profile / settings endpoints."""

import io
import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from pydantic import BaseModel, EmailStr
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db, get_redis
from src.core.security import hash_password, verify_password
from src.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])

MAX_AVATAR_BYTES = 5 * 1024 * 1024  # 5 MB


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class ProfileResponse(BaseModel):
    id: str
    email: str
    name: str
    locale: str
    plan: str
    role: str
    avatar_url: str | None
    onboarding_completed: bool


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    locale: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _profile_response(user: User) -> ProfileResponse:
    return ProfileResponse(
        id=str(user.id),
        email=user.email,
        name=user.name,
        locale=user.locale,
        plan=user.plan,
        role=user.role,
        avatar_url=user.avatar_url,
        onboarding_completed=user.onboarding_completed,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    redis: Redis = Depends(get_redis),
) -> ProfileResponse:
    cache_key = f"profile:{current_user.id}"
    cached = await redis.get(cache_key)
    if cached:
        return ProfileResponse(**json.loads(cached))

    result = _profile_response(current_user)
    await redis.setex(cache_key, 120, json.dumps(result.model_dump()))
    return result


@router.patch("", response_model=ProfileResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> ProfileResponse:
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None:
        current_user.email = str(body.email)
    if body.locale is not None:
        current_user.locale = body.locale

    await db.commit()
    await db.refresh(current_user)

    cache_key = f"profile:{current_user.id}"
    await redis.delete(cache_key)

    return _profile_response(current_user)


@router.post("/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta.",
        )

    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Nova senha deve ter pelo menos 8 caracteres.",
        )

    current_user.hashed_password = hash_password(body.new_password)
    await db.commit()


@router.post("/avatar", response_model=ProfileResponse)
async def upload_profile_avatar(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> ProfileResponse:
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato inválido. Use JPEG, PNG ou WebP.",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Imagem muito grande. Máximo 5 MB.",
        )

    # H-3: Derive extension from validated MIME type, never from user-supplied filename
    MIME_TO_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    ext = MIME_TO_EXT[file.content_type]
    object_name = f"avatars/{current_user.id}/{uuid.uuid4()}.{ext}"

    try:
        from src.core.storage import upload_file, get_public_url

        upload_file(object_name, content, content_type=file.content_type or "image/jpeg")
        avatar_url = get_public_url(object_name)
    except Exception as exc:
        logger.warning("Storage upload failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de armazenamento indisponível. Tente novamente.",
        ) from exc

    current_user.avatar_url = avatar_url
    await db.commit()
    await db.refresh(current_user)

    cache_key = f"profile:{current_user.id}"
    await redis.delete(cache_key)

    return _profile_response(current_user)

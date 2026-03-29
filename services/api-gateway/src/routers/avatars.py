import math
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db
from src.core.storage import get_presigned_url, upload_file
from src.models.avatar import Avatar, AvatarStatus, AvatarTraining, TrainingStatus
from src.models.user import User
from src.schemas.avatar import (
    AvatarCreate,
    AvatarListResponse,
    AvatarResponse,
    AvatarTrainingResponse,
    AvatarUpdate,
)

router = APIRouter(prefix="/api/v1/avatars", tags=["avatars"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


def _build_avatar_response(avatar: Avatar) -> AvatarResponse:
    photo_url: str | None = None
    if avatar.photo_path:
        try:
            photo_url = get_presigned_url(avatar.photo_path)
        except Exception:
            photo_url = None

    return AvatarResponse(
        id=avatar.id,
        owner_id=avatar.owner_id,
        name=avatar.name,
        description=avatar.description,
        photo_url=photo_url,
        status=avatar.status,
        created_at=avatar.created_at,
        updated_at=avatar.updated_at,
    )


@router.post(
    "",
    response_model=AvatarResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_avatar(
    payload: AvatarCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarResponse:
    """Cria um avatar com nome e descrição (JSON body)."""
    avatar = Avatar(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(avatar)
    await db.commit()
    await db.refresh(avatar)
    return _build_avatar_response(avatar)


@router.post(
    "/{avatar_id}/photos",
    response_model=AvatarResponse,
)
async def upload_avatar_photo(
    avatar_id: uuid.UUID,
    photos: list[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarResponse:
    """Upload de fotos para o avatar."""
    result = await db.execute(
        select(Avatar).where(Avatar.id == avatar_id, Avatar.owner_id == current_user.id)
    )
    avatar = result.scalar_one_or_none()
    if avatar is None:
        raise HTTPException(status_code=404, detail="Avatar não encontrado.")

    # Salva a primeira foto como foto principal
    for photo in photos:
        if photo.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Tipo de imagem não suportado: {photo.content_type}. Use JPEG, PNG ou WebP.",
            )

        data = await photo.read()
        if len(data) > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Imagem excede o tamanho máximo de 10 MB.",
            )

        extension = photo.filename.rsplit(".", 1)[-1] if photo.filename else "jpg"
        object_name = f"avatars/{current_user.id}/{avatar_id}/{uuid.uuid4()}.{extension}"
        upload_file(object_name, data, content_type=photo.content_type or "image/jpeg")

        if avatar.photo_path is None:
            avatar.photo_path = object_name

    avatar.status = AvatarStatus.READY_TO_TRAIN if avatar.photo_path else AvatarStatus.DRAFT
    await db.commit()
    await db.refresh(avatar)
    return _build_avatar_response(avatar)


@router.get("", response_model=AvatarListResponse)
async def list_avatars(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, max_length=255),
    status_filter: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarListResponse:
    base_query = select(Avatar).where(
        Avatar.owner_id == current_user.id,
        Avatar.deleted_at.is_(None),
    )

    if search:
        base_query = base_query.where(Avatar.name.ilike(f"%{search}%"))
    if status_filter:
        base_query = base_query.where(Avatar.status == status_filter)

    # Count
    count_query = select(func.count()).select_from(base_query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Items
    offset = (page - 1) * page_size
    items_query = (
        base_query.order_by(Avatar.created_at.desc()).offset(offset).limit(page_size)
    )
    result = await db.execute(items_query)
    avatars = list(result.scalars().all())

    return AvatarListResponse(
        items=[_build_avatar_response(a) for a in avatars],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{avatar_id}", response_model=AvatarResponse)
async def get_avatar(
    avatar_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarResponse:
    avatar = await _get_user_avatar(db, avatar_id, current_user.id)
    return _build_avatar_response(avatar)


@router.patch("/{avatar_id}", response_model=AvatarResponse)
async def update_avatar(
    avatar_id: uuid.UUID,
    payload: AvatarUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarResponse:
    avatar = await _get_user_avatar(db, avatar_id, current_user.id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(avatar, field, value)

    await db.flush()
    await db.refresh(avatar)
    return _build_avatar_response(avatar)


@router.delete("/{avatar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_avatar(
    avatar_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    avatar = await _get_user_avatar(db, avatar_id, current_user.id)
    avatar.soft_delete()
    await db.flush()


@router.post(
    "/{avatar_id}/train",
    response_model=AvatarTrainingResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def train_avatar(
    avatar_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarTraining:
    avatar = await _get_user_avatar(db, avatar_id, current_user.id)

    if avatar.status == AvatarStatus.TRAINING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este avatar já está em treinamento.",
        )

    from src.workers.background_tasks import start_avatar_training

    training = AvatarTraining(
        avatar_id=avatar.id,
        status=TrainingStatus.QUEUED,
    )
    db.add(training)
    avatar.status = AvatarStatus.TRAINING  # type: ignore[assignment]
    await db.flush()
    await db.refresh(training)

    # Launch background thread (replaces Celery task)
    start_avatar_training(str(training.id), str(avatar.id))

    return training


@router.get(
    "/{avatar_id}/status",
    response_model=AvatarTrainingResponse,
)
async def get_training_status(
    avatar_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AvatarTraining:
    avatar = await _get_user_avatar(db, avatar_id, current_user.id)

    result = await db.execute(
        select(AvatarTraining)
        .where(AvatarTraining.avatar_id == avatar.id)
        .order_by(AvatarTraining.created_at.desc())
        .limit(1)
    )
    training = result.scalar_one_or_none()

    if training is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum treinamento encontrado para este avatar.",
        )

    return training


async def _get_user_avatar(
    db: AsyncSession, avatar_id: uuid.UUID, owner_id: uuid.UUID
) -> Avatar:
    result = await db.execute(
        select(Avatar).where(
            Avatar.id == avatar_id,
            Avatar.owner_id == owner_id,
            Avatar.deleted_at.is_(None),
        )
    )
    avatar = result.scalar_one_or_none()

    if avatar is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avatar não encontrado.",
        )

    return avatar

"""Video generation endpoints — persists to DB."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db
from src.models.user import User
from src.models.video import Video
from src.services.video_generator import generate_video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/videos", tags=["videos"])

SUPPORTED_LANGUAGES = {"pt", "en", "es", "fr", "de", "it", "ja", "ko", "zh-CN"}
MAX_SCRIPT_LENGTH = 5000


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class VideoGenerateRequest(BaseModel):
    script: str = Field(..., min_length=1, max_length=MAX_SCRIPT_LENGTH)
    language: str = Field(default="pt")
    bg_color: str = Field(default="0x1a1a2e")
    title: str | None = Field(default=None, max_length=255)


class VideoMetadataResponse(BaseModel):
    id: str
    title: str | None
    status: str
    download_url: str
    duration_seconds: float
    file_size_bytes: int
    language: str
    created_at: str


class VideoListResponse(BaseModel):
    items: list[VideoMetadataResponse]
    total: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _video_response(v: Video) -> VideoMetadataResponse:
    return VideoMetadataResponse(
        id=str(v.id),
        title=v.title,
        status=v.status,
        download_url=f"/api/v1/videos/{v.id}/download",
        duration_seconds=v.duration_secs,
        file_size_bytes=v.file_size,
        language=v.language,
        created_at=v.created_at.isoformat(),
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/generate",
    response_model=VideoMetadataResponse,
    status_code=status.HTTP_201_CREATED,
)
async def generate_video_endpoint(
    payload: VideoGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoMetadataResponse:
    if payload.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Unsupported language '{payload.language}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_LANGUAGES))}"
            ),
        )

    try:
        result = generate_video(
            script=payload.script,
            language=payload.language,
            bg_color=payload.bg_color,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        logger.error("Video generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video generation failed: {exc}",
        ) from exc

    video = Video(
        owner_id=current_user.id,
        title=payload.title,
        script=payload.script,
        language=payload.language,
        status="ready",
        file_path=result.file_path,
        duration_secs=result.duration_seconds,
        file_size=result.file_size_bytes,
    )
    db.add(video)
    await db.commit()
    await db.refresh(video)

    return _video_response(video)


@router.get("/{video_id}/download", response_class=FileResponse)
async def download_video(
    video_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    try:
        vid_uuid = uuid.UUID(video_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    result = await db.execute(
        select(Video).where(
            Video.id == vid_uuid,
            Video.owner_id == current_user.id,
            Video.deleted_at.is_(None),
        )
    )
    video = result.scalar_one_or_none()
    if video is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")

    if not video.file_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video file not available.")

    return FileResponse(
        path=video.file_path,
        media_type="video/mp4",
        filename=f"clonestudio-{video_id}.mp4",
    )


@router.get("", response_model=VideoListResponse)
async def list_videos(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VideoListResponse:
    rows = await db.execute(
        select(Video)
        .where(Video.owner_id == current_user.id, Video.deleted_at.is_(None))
        .order_by(Video.created_at.desc())
    )
    videos = rows.scalars().all()
    items = [_video_response(v) for v in videos]
    return VideoListResponse(items=items, total=len(items))

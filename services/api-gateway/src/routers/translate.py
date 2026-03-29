"""Translate pipeline endpoints."""

import logging
import uuid as uuid_module

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db
from src.models.translate_job import TranslateJob
from src.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/translate", tags=["translate"])

SUPPORTED_LANGUAGES = {"pt", "en", "es", "fr", "de", "it", "ja", "ko", "zh"}
MAX_VIDEO_BYTES = 500 * 1024 * 1024  # 500 MB


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class TranslateJobResponse(BaseModel):
    id: str
    status: str
    progress: int
    source_language: str
    target_language: str
    file_size: int
    error_message: str | None
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _job_response(job: TranslateJob) -> TranslateJobResponse:
    return TranslateJobResponse(
        id=str(job.id),
        status=job.status,
        progress=job.progress,
        source_language=job.source_language,
        target_language=job.target_language,
        file_size=job.file_size,
        error_message=job.error_message,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat(),
    )


async def _get_job_or_404(
    job_id: str,
    owner_id: object,
    db: AsyncSession,
) -> TranslateJob:
    try:
        job_uuid = uuid_module.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job não encontrado.")

    result = await db.execute(
        select(TranslateJob).where(
            TranslateJob.id == job_uuid,
            TranslateJob.owner_id == owner_id,
        )
    )
    job = result.scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job não encontrado.")
    return job


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/jobs",
    response_model=TranslateJobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_translate_job(
    file: UploadFile,
    target_language: str = "en",
    source_language: str = "pt",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TranslateJobResponse:
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Idioma '{target_language}' não suportado. Suportados: {', '.join(sorted(SUPPORTED_LANGUAGES))}",
        )

    if source_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Idioma de origem '{source_language}' não suportado.",
        )

    if file.content_type not in ("video/mp4", "video/webm", "video/quicktime"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato inválido. Use MP4, WebM ou MOV.",
        )

    content = await file.read()
    file_size = len(content)
    if file_size > MAX_VIDEO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande. Máximo 500 MB.",
        )

    # Save file to temp path
    import tempfile
    import os

    temp_dir = tempfile.gettempdir()
    file_ext = (file.filename or "video.mp4").rsplit(".", 1)[-1]
    source_filename = f"{uuid_module.uuid4()}.{file_ext}"
    source_path = os.path.join(temp_dir, source_filename)

    with open(source_path, "wb") as f:
        f.write(content)

    # Persist job
    job = TranslateJob(
        owner_id=current_user.id,
        source_path=source_path,
        source_language=source_language,
        target_language=target_language,
        status="queued",
        progress=0,
        file_size=file_size,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch background thread (replaces Celery task)
    try:
        from src.workers.background_tasks import start_translate_video

        start_translate_video(str(job.id))
        await db.commit()
    except Exception as exc:
        logger.error("Failed to start translate task: %s", exc)
        job.status = "failed"
        job.error_message = "Processamento indisponível. Tente novamente."
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Serviço de tradução indisponível no momento. Tente novamente em instantes.",
        ) from exc

    return _job_response(job)


@router.get("/jobs", response_model=list[TranslateJobResponse])
async def list_translate_jobs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TranslateJobResponse]:
    rows = await db.execute(
        select(TranslateJob)
        .where(TranslateJob.owner_id == current_user.id)
        .order_by(TranslateJob.created_at.desc())
    )
    jobs = rows.scalars().all()
    return [_job_response(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=TranslateJobResponse)
async def get_translate_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TranslateJobResponse:
    job = await _get_job_or_404(job_id, current_user.id, db)
    return _job_response(job)


@router.get("/jobs/{job_id}/download")
async def download_translated_video(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> FileResponse:
    job = await _get_job_or_404(job_id, current_user.id, db)

    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job ainda não concluído. Status: {job.status}",
        )

    output_path = job.output_path or job.source_path
    if not output_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo de saída não encontrado.",
        )

    import os
    import pathlib
    import tempfile

    # C-3: Prevent path traversal — only serve files from the system temp dir
    allowed_dir = pathlib.Path(tempfile.gettempdir()).resolve()
    resolved = pathlib.Path(output_path).resolve()
    if not str(resolved).startswith(str(allowed_dir)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado.",
        )

    if not os.path.exists(resolved):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Arquivo de saída não encontrado no servidor.",
        )

    return FileResponse(
        path=str(resolved),
        media_type="video/mp4",
        filename=f"translated-{job_id}.mp4",
    )

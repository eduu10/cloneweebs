"""Celery task for video translation pipeline (placeholder — Sprint 6)."""

import logging
import time

from src.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="translate_video",
    queue="translate_queue",
    max_retries=3,
    soft_time_limit=300,
    time_limit=360,
)
def translate_video(self, job_id: str) -> dict:
    """Translate a video. Placeholder: simulates progress, real AI pipeline in future sprint."""
    logger.info("translate_video started for job_id=%s", job_id)

    try:
        _update_job_status(job_id, "processing", 0)

        # Simulate 5 stages of progress
        stages = [
            (10, "Extraindo áudio..."),
            (30, "Transcrevendo fala..."),
            (55, "Traduzindo texto..."),
            (75, "Sintetizando voz..."),
            (90, "Remontando vídeo..."),
        ]

        for progress, label in stages:
            time.sleep(2)
            _update_job_status(job_id, "processing", progress)
            logger.info("job_id=%s progress=%d%% (%s)", job_id, progress, label)

        time.sleep(1)
        _update_job_status(job_id, "completed", 100)
        logger.info("translate_video completed for job_id=%s", job_id)

        return {"job_id": job_id, "status": "completed"}

    except Exception as exc:
        logger.error("translate_video failed for job_id=%s: %s", job_id, exc)
        _update_job_status(job_id, "failed", 0, error=str(exc))
        raise


def _update_job_status(
    job_id: str,
    status: str,
    progress: int,
    error: str | None = None,
) -> None:
    """Update TranslateJob in DB using synchronous SQLAlchemy (safe inside Celery worker).

    H-4 fix: avoid creating a new async engine per call — use sync engine instead,
    which is more natural for synchronous Celery tasks and avoids event loop conflicts.
    """
    try:
        from uuid import UUID

        from sqlalchemy import create_engine, select, update
        from sqlalchemy.orm import Session

        from src.core.config import settings
        from src.models.translate_job import TranslateJob

        # Convert asyncpg URL to psycopg2 for sync usage
        sync_url = settings.database_url.replace(
            "postgresql+asyncpg://", "postgresql+psycopg2://"
        )

        engine = create_engine(sync_url, pool_pre_ping=True, pool_size=2, max_overflow=2)
        with Session(engine) as session:
            session.execute(
                update(TranslateJob)
                .where(TranslateJob.id == UUID(job_id))
                .values(
                    status=status,
                    progress=progress,
                    **({"error_message": error} if error else {}),
                )
            )
            session.commit()
        engine.dispose()

    except Exception as exc:
        logger.warning("Failed to update job status in DB for job_id=%s: %s", job_id, exc)

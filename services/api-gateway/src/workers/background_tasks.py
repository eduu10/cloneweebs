"""Background task runners — replace Celery for free tier deployment.

Uses Python threading to simulate async progress updates.
These are placeholder pipelines (same behavior as the Celery tasks).
"""

import logging
import threading
import time
from uuid import UUID

from sqlalchemy import create_engine, update
from sqlalchemy.orm import Session

from src.core.config import settings

logger = logging.getLogger(__name__)


def _get_sync_engine():
    """Create a sync SQLAlchemy engine from the async URL."""
    sync_url = settings.database_url.replace(
        "postgresql+asyncpg://", "postgresql+psycopg2://"
    )
    return create_engine(sync_url, pool_pre_ping=True, pool_size=2, max_overflow=2)


def _update_training_status(
    training_id: str,
    status: str,
    progress: int,
    error: str | None = None,
) -> None:
    """Update AvatarTraining row in DB."""
    try:
        from src.models.avatar import AvatarTraining

        engine = _get_sync_engine()
        with Session(engine) as session:
            values = {"status": status, "progress": progress}
            if error:
                values["error_message"] = error
            session.execute(
                update(AvatarTraining)
                .where(AvatarTraining.id == UUID(training_id))
                .values(**values)
            )
            session.commit()
        engine.dispose()
    except Exception as exc:
        logger.warning("Failed to update training status for %s: %s", training_id, exc)


def _update_avatar_status(avatar_id: str, status: str) -> None:
    """Update Avatar.status in DB."""
    try:
        from src.models.avatar import Avatar

        engine = _get_sync_engine()
        with Session(engine) as session:
            session.execute(
                update(Avatar)
                .where(Avatar.id == UUID(avatar_id))
                .values(status=status)
            )
            session.commit()
        engine.dispose()
    except Exception as exc:
        logger.warning("Failed to update avatar status for %s: %s", avatar_id, exc)


def _update_translate_job(
    job_id: str,
    status: str,
    progress: int,
    error: str | None = None,
) -> None:
    """Update TranslateJob row in DB."""
    try:
        from src.models.translate_job import TranslateJob

        engine = _get_sync_engine()
        with Session(engine) as session:
            values = {"status": status, "progress": progress}
            if error:
                values["error_message"] = error
            session.execute(
                update(TranslateJob)
                .where(TranslateJob.id == UUID(job_id))
                .values(**values)
            )
            session.commit()
        engine.dispose()
    except Exception as exc:
        logger.warning("Failed to update translate job %s: %s", job_id, exc)


# ---------------------------------------------------------------------------
# Avatar Training (background thread)
# ---------------------------------------------------------------------------


def _run_avatar_training(training_id: str, avatar_id: str) -> None:
    """Simulate avatar training in a background thread."""
    logger.info("Background training started: training_id=%s", training_id)
    try:
        total_steps = 10
        for step in range(1, total_steps + 1):
            progress = int((step / total_steps) * 100)
            _update_training_status(training_id, "processing", progress)
            time.sleep(3)

        _update_training_status(training_id, "completed", 100)
        _update_avatar_status(avatar_id, "ready")
        logger.info("Background training completed: training_id=%s", training_id)
    except Exception as exc:
        logger.error("Background training failed: %s", exc)
        _update_training_status(training_id, "failed", 0, error=str(exc))
        _update_avatar_status(avatar_id, "failed")


def start_avatar_training(training_id: str, avatar_id: str) -> None:
    """Launch avatar training in a daemon thread."""
    thread = threading.Thread(
        target=_run_avatar_training,
        args=(training_id, avatar_id),
        daemon=True,
        name=f"train-{training_id[:8]}",
    )
    thread.start()


# ---------------------------------------------------------------------------
# Video Translation (background thread)
# ---------------------------------------------------------------------------


def _run_translate_video(job_id: str) -> None:
    """Simulate video translation in a background thread."""
    logger.info("Background translation started: job_id=%s", job_id)
    try:
        _update_translate_job(job_id, "processing", 0)

        stages = [
            (10, "Extraindo áudio..."),
            (30, "Transcrevendo fala..."),
            (55, "Traduzindo texto..."),
            (75, "Sintetizando voz..."),
            (90, "Remontando vídeo..."),
        ]

        for progress, label in stages:
            time.sleep(2)
            _update_translate_job(job_id, "processing", progress)
            logger.info("job_id=%s progress=%d%% (%s)", job_id, progress, label)

        time.sleep(1)
        _update_translate_job(job_id, "completed", 100)
        logger.info("Background translation completed: job_id=%s", job_id)
    except Exception as exc:
        logger.error("Background translation failed for %s: %s", job_id, exc)
        _update_translate_job(job_id, "failed", 0, error=str(exc))


def start_translate_video(job_id: str) -> None:
    """Launch video translation in a daemon thread."""
    thread = threading.Thread(
        target=_run_translate_video,
        args=(job_id,),
        daemon=True,
        name=f"translate-{job_id[:8]}",
    )
    thread.start()

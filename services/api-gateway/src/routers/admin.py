import time

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_db, require_admin
from src.models.avatar import Avatar
from src.models.system_log import SystemLog
from src.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class LogEntryCreate(BaseModel):
    level: str = Field(..., pattern=r"^(info|warn|error|critical)$")
    message: str = Field(..., min_length=1, max_length=5000)
    service: str = Field(..., min_length=1, max_length=100)


# ---------------------------------------------------------------------------
# Existing endpoints
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_users(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(User).where(User.deleted_at.is_(None)).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    return {
        "data": [
            {
                "id": str(u.id),
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "plan": u.plan,
                "locale": u.locale,
                "onboarding_completed": u.onboarding_completed,
                "created_at": u.created_at.isoformat(),
                "updated_at": u.updated_at.isoformat(),
            }
            for u in users
        ],
        "total": len(users),
    }


@router.get("/stats")
async def get_stats(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # User counts
    total_users_result = await db.execute(
        select(func.count(User.id)).where(User.deleted_at.is_(None))
    )
    total_users = total_users_result.scalar() or 0

    admin_count_result = await db.execute(
        select(func.count(User.id)).where(
            User.deleted_at.is_(None), User.role == "admin"
        )
    )
    total_admins = admin_count_result.scalar() or 0

    total_clients = total_users - total_admins

    # Avatar counts
    total_avatars_result = await db.execute(
        select(func.count(Avatar.id)).where(Avatar.deleted_at.is_(None))
    )
    total_avatars = total_avatars_result.scalar() or 0

    return {
        "total_users": total_users,
        "total_admins": total_admins,
        "total_clients": total_clients,
        "total_avatars": total_avatars,
        "total_videos": 0,
    }


@router.get("/avatars")
async def list_avatars(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(Avatar, User.name.label("owner_name"), User.email.label("owner_email"))
        .join(User, Avatar.owner_id == User.id)
        .where(Avatar.deleted_at.is_(None))
        .order_by(Avatar.created_at.desc())
    )
    rows = result.all()

    return {
        "data": [
            {
                "id": str(row.Avatar.id),
                "name": row.Avatar.name,
                "status": row.Avatar.status,
                "owner_name": row.owner_name,
                "owner_email": row.owner_email,
                "photo_path": row.Avatar.photo_path,
                "description": row.Avatar.description,
                "created_at": row.Avatar.created_at.isoformat(),
            }
            for row in rows
        ],
        "total": len(rows),
    }


@router.get("/billing")
async def billing_overview(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Plan breakdown
    plan_result = await db.execute(
        select(User.plan, func.count(User.id))
        .where(User.deleted_at.is_(None))
        .group_by(User.plan)
    )
    plan_rows = plan_result.all()
    plan_breakdown = [
        {"plan": row[0], "count": row[1]}
        for row in plan_rows
    ]

    return {
        "plan_breakdown": plan_breakdown,
    }


@router.get("/health")
async def system_health(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Check DB
    db_ok = False
    try:
        await db.execute(select(func.now()))
        db_ok = True
    except Exception:
        pass

    from src.core.redis import get_redis_client

    redis_ok = False
    try:
        redis = await get_redis_client()
        await redis.ping()
        redis_ok = True
    except Exception:
        pass

    from src.core.storage import check_health as check_storage_health

    storage_ok = False
    try:
        storage_ok = check_storage_health()
    except Exception:
        pass

    return {
        "database": {"status": "healthy" if db_ok else "unhealthy"},
        "redis": {"status": "healthy" if redis_ok else "unhealthy"},
        "storage": {"status": "healthy" if storage_ok else "unhealthy"},
        "overall": "healthy" if (db_ok and redis_ok and storage_ok) else "degraded",
    }


# ---------------------------------------------------------------------------
# System monitoring endpoint
# ---------------------------------------------------------------------------

async def _check_postgres(db: AsyncSession) -> dict:
    """Check PostgreSQL connectivity and measure latency."""
    try:
        start = time.monotonic()
        await db.execute(text("SELECT 1"))
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return {"status": "online", "latency_ms": latency_ms}
    except Exception as exc:
        return {"status": "offline", "error": str(exc)}


async def _check_redis() -> dict:
    """Check Redis (db 0) connectivity and measure latency."""
    from src.core.redis import get_redis_client

    try:
        redis = await get_redis_client()
        start = time.monotonic()
        await redis.ping()
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return {"status": "online", "latency_ms": latency_ms}
    except Exception as exc:
        return {"status": "offline", "error": str(exc)}


def _check_storage() -> dict:
    """Check Supabase Storage connectivity and measure latency."""
    from src.core.storage import check_health

    try:
        start = time.monotonic()
        ok = check_health()
        latency_ms = round((time.monotonic() - start) * 1000, 2)
        return {"status": "online" if ok else "offline", "latency_ms": latency_ms}
    except Exception as exc:
        return {"status": "offline", "error": str(exc)}



@router.get("/system")
async def system_monitoring(
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Real-time system monitoring data.

    Returns service health with latency, Celery queue status,
    and the last 20 system log entries.
    """
    # Run checks (postgres and redis are async, minio is sync)
    postgres_status = await _check_postgres(db)
    redis_status = await _check_redis()
    storage_status = _check_storage()
    # Determine overall health
    all_online = all(
        s.get("status") == "online"
        for s in (postgres_status, redis_status, storage_status)
    )

    # Recent logs from system_logs table
    recent_logs: list[dict] = []
    try:
        result = await db.execute(
            select(SystemLog)
            .order_by(SystemLog.created_at.desc())
            .limit(20)
        )
        logs = result.scalars().all()
        recent_logs = [
            {
                "id": log.id,
                "level": log.level,
                "message": log.message,
                "service": log.service,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    except Exception:
        # Table may not exist yet on first run
        recent_logs = []

    return {
        "services": {
            "postgres": postgres_status,
            "redis": redis_status,
            "storage": storage_status,
        },
        "overall": "healthy" if all_online else "degraded",
        "recent_logs": recent_logs,
    }


# ---------------------------------------------------------------------------
# Log insertion endpoint
# ---------------------------------------------------------------------------

@router.post("/system/log")
async def create_system_log(
    payload: LogEntryCreate,
    _admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Insert a system log entry (for testing or worker error reporting)."""
    log_entry = SystemLog(
        level=payload.level,
        message=payload.message,
        service=payload.service,
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    return {
        "id": log_entry.id,
        "level": log_entry.level,
        "message": log_entry.message,
        "service": log_entry.service,
        "created_at": log_entry.created_at.isoformat() if log_entry.created_at else None,
    }

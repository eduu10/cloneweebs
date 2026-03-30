from fastapi import APIRouter, Depends
from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_db, get_redis
from src.core.storage import check_health as check_storage_health

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> dict[str, str | dict[str, str]]:
    checks: dict[str, str] = {}

    # Database
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as exc:
        checks["database"] = f"erro: {exc}"

    # Redis
    try:
        pong = await redis.ping()
        checks["redis"] = "ok" if pong else "erro: sem resposta"
    except Exception as exc:
        checks["redis"] = f"erro: {exc}"

    # Storage (Supabase)
    try:
        checks["storage"] = "ok" if check_storage_health() else "erro: unreachable"
    except Exception as exc:
        checks["storage"] = f"erro: {exc}"

    all_ok = all(v == "ok" for v in checks.values())

    # Debug: show DB URL (redacted password)
    from src.core.config import settings
    db_url = settings.effective_database_url
    # Redact password
    import re
    safe_url = re.sub(r'://([^:]+):([^@]+)@', r'://\1:***@', db_url)

    return {
        "status": "saudável" if all_ok else "degradado",
        "checks": checks,
        "debug_db_url": safe_url,
    }

"""Dashboard endpoints — real stats from DB + Redis cache."""

import json
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.deps import get_current_user, get_db, get_redis
from src.models.avatar import Avatar
from src.models.user import User
from src.models.video import Video

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class DashboardStats(BaseModel):
    total_avatars: int
    total_videos: int
    total_duration_secs: float
    credits_used: int
    credits_total: int


class RecentVideoItem(BaseModel):
    id: str
    title: str | None
    status: str
    language: str
    duration_secs: float
    created_at: str


class UsageDay(BaseModel):
    date: str
    videos: int
    duration_secs: float


class UsageResponse(BaseModel):
    period: str
    days: list[UsageDay]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> DashboardStats:
    cache_key = f"dashboard:stats:{current_user.id}"
    cached = await redis.get(cache_key)
    if cached:
        data = json.loads(cached)
        return DashboardStats(**data)

    avatar_count = await db.scalar(
        select(func.count(Avatar.id)).where(
            Avatar.owner_id == current_user.id,
            Avatar.deleted_at.is_(None),
        )
    ) or 0

    video_count = await db.scalar(
        select(func.count(Video.id)).where(
            Video.owner_id == current_user.id,
            Video.deleted_at.is_(None),
        )
    ) or 0

    total_duration = await db.scalar(
        select(func.coalesce(func.sum(Video.duration_secs), 0.0)).where(
            Video.owner_id == current_user.id,
            Video.deleted_at.is_(None),
        )
    ) or 0.0

    credits_map = {"free": 50, "creator": 200, "pro": 500, "enterprise": 9999}
    credits_total = credits_map.get(current_user.plan, 50)
    credits_used = min(video_count * 5, credits_total)

    result = DashboardStats(
        total_avatars=avatar_count,
        total_videos=video_count,
        total_duration_secs=float(total_duration),
        credits_used=credits_used,
        credits_total=credits_total,
    )

    await redis.setex(cache_key, 60, json.dumps(result.model_dump()))
    return result


@router.get("/recent-videos", response_model=list[RecentVideoItem])
async def get_recent_videos(
    limit: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RecentVideoItem]:
    if limit < 1 or limit > 50:
        limit = 5

    rows = await db.execute(
        select(Video)
        .where(Video.owner_id == current_user.id, Video.deleted_at.is_(None))
        .order_by(Video.created_at.desc())
        .limit(limit)
    )
    videos = rows.scalars().all()

    return [
        RecentVideoItem(
            id=str(v.id),
            title=v.title,
            status=v.status,
            language=v.language,
            duration_secs=v.duration_secs,
            created_at=v.created_at.isoformat(),
        )
        for v in videos
    ]


@router.get("/usage", response_model=UsageResponse)
async def get_usage(
    period: str = "30d",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
) -> UsageResponse:
    if period not in ("7d", "30d", "90d"):
        period = "30d"

    cache_key = f"dashboard:usage:{current_user.id}:{period}"
    cached = await redis.get(cache_key)
    if cached:
        data = json.loads(cached)
        return UsageResponse(**data)

    days_map = {"7d": 7, "30d": 30, "90d": 90}
    num_days = days_map[period]
    since = datetime.now(timezone.utc) - timedelta(days=num_days)

    rows = await db.execute(
        select(Video).where(
            Video.owner_id == current_user.id,
            Video.deleted_at.is_(None),
            Video.created_at >= since,
        )
    )
    videos = rows.scalars().all()

    by_date: dict[str, UsageDay] = {}
    for v in videos:
        day_str = v.created_at.strftime("%Y-%m-%d")
        if day_str not in by_date:
            by_date[day_str] = UsageDay(date=day_str, videos=0, duration_secs=0.0)
        existing = by_date[day_str]
        by_date[day_str] = UsageDay(
            date=day_str,
            videos=existing.videos + 1,
            duration_secs=existing.duration_secs + v.duration_secs,
        )

    days_list = sorted(by_date.values(), key=lambda d: d.date)
    result = UsageResponse(period=period, days=days_list)

    await redis.setex(cache_key, 300, json.dumps(result.model_dump()))
    return result

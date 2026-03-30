"""Redis client — connects to Upstash (free tier) or falls back to a no-op stub."""

import logging

from src.core.config import settings

logger = logging.getLogger(__name__)

_redis_client = None


class _NoOpRedis:
    """Stub that silently ignores all Redis operations when no URL is configured."""

    async def get(self, key: str) -> None:
        return None

    async def set(self, key: str, value: str, **kwargs: object) -> None:
        pass

    async def setex(self, key: str, ttl: int, value: str) -> None:
        pass

    async def delete(self, *keys: str) -> None:
        pass

    async def ping(self) -> bool:
        return True

    async def close(self) -> None:
        pass


async def get_redis_client():
    global _redis_client  # noqa: PLW0603
    if _redis_client is None:
        if settings.redis_url:
            try:
                from redis.asyncio import from_url

                _redis_client = from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await _redis_client.ping()
                logger.info("Redis connected: %s", settings.redis_url[:30])
            except Exception as exc:
                logger.warning("Redis unavailable (%s), using no-op stub", exc)
                _redis_client = _NoOpRedis()
        else:
            logger.info("No REDIS_URL configured, using no-op stub")
            _redis_client = _NoOpRedis()
    return _redis_client


async def close_redis_client() -> None:
    global _redis_client  # noqa: PLW0603
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None

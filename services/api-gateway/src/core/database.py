"""Database engine — lazy initialization to avoid startup crashes."""

from collections.abc import AsyncGenerator

from sqlalchemy import make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.config import settings

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _get_engine() -> AsyncEngine:
    global _engine  # noqa: PLW0603
    if _engine is None:
        url = make_url(settings.effective_database_url)

        connect_args: dict = {}
        if "pooler.supabase.com" in (url.host or ""):
            connect_args["prepared_statement_cache_size"] = 0
            connect_args["statement_cache_size"] = 0

        _engine = create_async_engine(
            url,
            echo=settings.database_echo,
            pool_size=5,
            max_overflow=3,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args=connect_args,
        )
    return _engine


def _get_session_factory() -> async_sessionmaker[AsyncSession]:
    global _session_factory  # noqa: PLW0603
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            _get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    factory = _get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

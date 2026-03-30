from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from src.core.config import settings

# Supabase pooler (port 6543) uses transaction mode — disable prepared statements
connect_args = {}
if "pooler.supabase.com" in settings.database_url:
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=5,
    max_overflow=3,
    pool_pre_ping=True,
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

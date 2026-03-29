"""Seed script - creates admin and client users."""

import asyncio
import uuid

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.config import settings
from src.core.security import hash_password
from src.models.base import Base
from src.models.user import User
from src.models.consent import Consent  # noqa: F401 — needed for relationship resolution
from src.models.avatar import Avatar  # noqa: F401
from src.models.system_log import SystemLog  # noqa: F401 — needed for create_all
from src.models.video import Video  # noqa: F401
from src.models.agent_conversation import AgentConversation  # noqa: F401
from src.models.agent_message import AgentMessage  # noqa: F401
from src.models.translate_job import TranslateJob  # noqa: F401

USERS_TO_SEED = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000010"),
        "email": "admin@cloneweebs.ai",
        "name": "Admin",
        "password": "Admin@2026",
        "role": "admin",
        "plan": "enterprise",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000011"),
        "email": "eduu10@cloneweebs.ai",
        "name": "Eduu10",
        "password": "Eduu10@2026",
        "role": "admin",
        "plan": "enterprise",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000020"),
        "email": "sergio@cloneweebs.ai",
        "name": "Sergio",
        "password": "Sergio@2026",
        "role": "client",
        "plan": "pro",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000021"),
        "email": "paulo@cloneweebs.ai",
        "name": "Paulo",
        "password": "Paulo@2026",
        "role": "client",
        "plan": "free",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000022"),
        "email": "marilia@cloneweebs.ai",
        "name": "Marilia",
        "password": "Marilia@2026",
        "role": "client",
        "plan": "creator",
    },
]


async def seed() -> None:
    engine = create_async_engine(settings.database_url, echo=False)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Add role column if missing (migration)
    async with engine.begin() as conn:
        await conn.execute(
            text(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'client'"
            )
        )

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        for user_data in USERS_TO_SEED:
            result = await db.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()

            if existing is not None:
                print(f"  [skip] {user_data['email']} already exists")
                continue

            user = User(
                id=user_data["id"],
                email=user_data["email"],
                name=user_data["name"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"],
                plan=user_data["plan"],
                onboarding_completed=True,
            )
            db.add(user)
            print(f"  [created] {user_data['email']} ({user_data['role']})")

        await db.commit()

    await engine.dispose()
    print("\nSeed completed!")


if __name__ == "__main__":
    asyncio.run(seed())

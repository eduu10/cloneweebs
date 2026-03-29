from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import settings
from src.core.redis import close_redis_client
from src.routers import admin, agent, auth, avatars, consents, dashboard, health, profile, translate, videos


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    yield
    # Shutdown
    await close_redis_client()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(consents.router)
app.include_router(avatars.router)
app.include_router(videos.router)
app.include_router(admin.router)
app.include_router(dashboard.router)
app.include_router(profile.router)
app.include_router(agent.router)
app.include_router(translate.router)

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "CloneWeebs Avatar Service"
    app_version: str = "0.1.0"
    debug: bool = False
    environment: str = "development"

    # Database (Supabase PostgreSQL free tier)
    database_url: str = "postgresql+asyncpg://postgres:postgres@db.xxx.supabase.co:5432/postgres"
    database_echo: bool = False

    # Redis (Upstash free tier) — optional, app works without it
    redis_url: str = ""

    # Storage — Supabase Storage (free tier, 1GB)
    supabase_url: str = ""
    supabase_service_key: str = ""
    storage_bucket: str = "avatars"

    # JWT — no default; must be set via env var
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # LLM — Groq free tier (Llama 3)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_timeout: int = 30

    # File upload limits
    max_video_upload_mb: int = 500
    max_avatar_upload_mb: int = 5


settings = Settings()

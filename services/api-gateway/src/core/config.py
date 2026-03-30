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

    # Alternative: separate DB components (overrides database_url if all are set)
    db_host: str = ""
    db_port: int = 6543
    db_user: str = ""
    db_password: str = ""
    db_name: str = "postgres"

    @property
    def effective_database_url(self) -> str:
        """Build URL from components if available, otherwise use database_url."""
        if self.db_host and self.db_user and self.db_password:
            from urllib.parse import quote_plus
            password = quote_plus(self.db_password)
            return f"postgresql+asyncpg://{self.db_user}:{password}@{self.db_host}:{self.db_port}/{self.db_name}"
        return self.database_url

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

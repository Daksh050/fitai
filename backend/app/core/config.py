from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FitAI"
    DEBUG: bool = False
    SECRET_KEY: str = "fitai-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database — set DATABASE_URL to use Neon/Postgres, otherwise falls back to SQLite
    DATABASE_URL: Optional[str] = None
    POSTGRES_USER: str = "fitai_user"
    POSTGRES_PASSWORD: str = "fitai_pass"
    POSTGRES_DB: str = "fitai_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            # Neon/Postgres URL — convert postgres:// to postgresql+asyncpg://
            url = self.DATABASE_URL
            if url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgresql://") and "+asyncpg" not in url:
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return url
        # Local SQLite fallback
        return "sqlite+aiosqlite:///./fitai.db"

    # AI provider
    AI_PROVIDER: str = "gemini"   # local | gemini | anthropic
    AI_MODEL: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    AI_FALLBACK_TO_LOCAL: bool = True

    # Nutrition APIs
    USDA_API_KEY: str = ""
    OPEN_FOOD_FACTS_BASE_URL: str = "https://world.openfoodfacts.org"

    class Config:
        env_file = ".env"

settings = Settings()

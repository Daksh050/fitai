from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "FitAI"
    DEBUG: bool = False
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    POSTGRES_USER: str = "fitai_user"
    POSTGRES_PASSWORD: str = "fitai_pass"
    POSTGRES_DB: str = "fitai_db"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # AI / Anthropic
    ANTHROPIC_API_KEY: str = ""

    # Nutrition APIs
    USDA_API_KEY: str = ""  # https://api.nal.usda.gov
    OPEN_FOOD_FACTS_BASE_URL: str = "https://world.openfoodfacts.org"

    class Config:
        env_file = ".env"

settings = Settings()

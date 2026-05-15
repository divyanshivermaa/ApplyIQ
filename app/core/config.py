from pydantic import model_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str  # e.g. postgresql+psycopg://user:pass@localhost:5432/internship_ai
    SECRET_KEY: str = "CHANGE_ME_TO_ENV_SECRET"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ENV: str = "dev"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000"
    COOKIE_SECURE: bool = False

    SCHEDULER_TIMEZONE: str = "Asia/Kolkata"
    FOLLOWUP_DAILY_HOUR: int = 9
    FOLLOWUP_DAILY_MINUTE: int = 0
    FOLLOWUP_JOB_ENABLED: bool = True
    ADMIN_DEV_ENDPOINTS_ENABLED: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_secret(self):
        if self.ENV.lower() == "production" and self.SECRET_KEY == "CHANGE_ME_TO_ENV_SECRET":
            raise ValueError("SECRET_KEY must be set to a strong value in production")
        return self

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()

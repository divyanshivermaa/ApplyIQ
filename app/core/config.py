from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str  # e.g. postgresql+psycopg://user:pass@localhost:5432/internship_ai
    ENV: str = "dev"

    SCHEDULER_TIMEZONE: str = "Asia/Kolkata"
    FOLLOWUP_DAILY_HOUR: int = 9
    FOLLOWUP_DAILY_MINUTE: int = 0
    FOLLOWUP_JOB_ENABLED: bool = True
    ADMIN_DEV_ENDPOINTS_ENABLED: bool = True

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

settings = Settings()

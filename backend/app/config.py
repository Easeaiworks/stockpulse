import os
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "StockPulse"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"

    # Database
    DATABASE_URL: str = f"sqlite:///{Path(__file__).parent.parent / 'data' / 'stockpulse.db'}"

    # Email notifications
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # SMS via email-to-SMS gateway (e.g., 1234567890@tmomail.net)
    SMS_GATEWAY_EMAIL: str = ""

    # Notification recipient
    NOTIFY_EMAIL: str = ""

    # Scheduler
    FETCH_INTERVAL_MINUTES: int = 60  # Default hourly

    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

# Ensure data directory exists
data_dir = Path(__file__).parent.parent / "data"
data_dir.mkdir(exist_ok=True)

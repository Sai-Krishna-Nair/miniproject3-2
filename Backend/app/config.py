import os
from typing import List

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Central configuration loaded from environment variables / .env file."""

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")

    AUTHORITY_INVITE_CODE: str = os.getenv("AUTHORITY_INVITE_CODE", "")

    CORS_ORIGINS: List[str] = ["*"]
    GEOFENCE_RADIUS_METERS: float = 30.0

    YOLO_MODEL_PATH: str = "best_pothole1.pt"

    POTHOLE_IMAGES_BUCKET: str = "pothole-images"
    AVATARS_BUCKET: str = "avatars"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

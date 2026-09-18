import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Event Memories"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "wedding-memories-super-secret-jwt-key-2026-dipendra-pratap-singh"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    SIGNED_URL_EXPIRE_SECONDS: int = 900  # 15 minutes signed token TTL
    
    # Wedding Metadata
    COUPLE_NAMES: str = "Aarav & Meera"
    WEDDING_DATE: str = "2026-11-20T17:00:00"
    VENUE_NAME: str = "The Grand Palace & Lake Pavilions"
    VENUE_CITY: str = "Udaipur, Rajasthan"
    VENUE_MAP_URL: str = "https://maps.google.com/?q=Udaipur+Palace"
    DESIGNER_NAME: str = "Dipendra Pratap Singh"
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/app_data.db")
    USE_SUPABASE: bool = os.getenv("USE_SUPABASE", "false").lower() == "true"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Storage Paths
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    PHOTOS_DIR: str = str(BASE_DIR / "uploads" / "photos")
    VIDEOS_DIR: str = str(BASE_DIR / "uploads" / "videos")
    THUMBNAILS_DIR: str = str(BASE_DIR / "uploads" / "thumbnails")
    TEMP_DIR: str = str(BASE_DIR / "uploads" / "temp")
    
    # Face Recognition Settings (OpenCV SFace cosine similarity benchmark ~0.363)
    # Cosine similarity >= 0.35 indicates reliable match across webcam and high-res photos
    FACE_SIMILARITY_THRESHOLD: float = 0.35
    MIN_FACE_CONFIDENCE: float = 0.70
    VIDEO_KEYFRAME_INTERVAL_SEC: float = 1.5
    
    # Rate Limiting & Security
    MAX_UPLOAD_SIZE_MB: int = 150
    ALLOWED_IMAGE_EXTENSIONS: list[str] = [".jpg", ".jpeg", ".png", ".webp"]
    ALLOWED_VIDEO_EXTENSIONS: list[str] = [".mp4", ".mov", ".webm", ".m4v"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

# Ensure directories exist
for path in [settings.UPLOAD_DIR, settings.PHOTOS_DIR, settings.VIDEOS_DIR, settings.THUMBNAILS_DIR, settings.TEMP_DIR]:
    os.makedirs(path, exist_ok=True)

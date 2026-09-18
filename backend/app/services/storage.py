import os
import uuid
import zipfile
import cv2
from PIL import Image
from typing import Optional, Any
from app.core.config import settings
from app.core.security import create_signed_media_token
from app.services.face_engine import face_engine
from app.db.database import get_db

class StorageService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        self.photos_dir = settings.PHOTOS_DIR
        self.videos_dir = settings.VIDEOS_DIR
        self.thumbnails_dir = settings.THUMBNAILS_DIR
        self.temp_dir = settings.TEMP_DIR

    def get_media_type(self, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower()
        if ext in settings.ALLOWED_VIDEO_EXTENSIONS:
            return "video"
        return "photo"

    def generate_thumbnail_image(self, src_path: str, thumb_filename: str) -> str:
        thumb_path = os.path.join(self.thumbnails_dir, thumb_filename)
        try:
            with Image.open(src_path) as img:
                img = img.convert("RGB")
                img.thumbnail((450, 450), Image.Resampling.LANCZOS)
                img.save(thumb_path, "JPEG", quality=85)
            return thumb_path
        except Exception:
            return src_path

    def generate_thumbnail_video(self, src_path: str, thumb_filename: str) -> str:
        thumb_path = os.path.join(self.thumbnails_dir, thumb_filename)
        try:
            cap = cv2.VideoCapture(src_path)
            ret, frame = cap.read()
            cap.release()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                scale = 450.0 / max(h, w)
                new_w, new_h = int(w * scale), int(h * scale)
                resized = cv2.resize(frame, (new_w, new_h))
                cv2.imwrite(thumb_path, resized, [cv2.IMWRITE_JPEG_QUALITY, 85])
                return thumb_path
        except Exception:
            pass
        return src_path

    def save_media_file(
        self,
        file_bytes: bytes,
        original_name: str,
        event_tag: str = "Ceremony",
        event_id: Optional[int] = None
    ) -> dict[str, Any]:
        """
        Saves media file, extracts metadata & face embeddings, and inserts into DB.
        """
        ext = os.path.splitext(original_name)[1].lower()
        if not ext:
            ext = ".jpg"
            
        media_type = self.get_media_type(original_name)
        unique_id = uuid.uuid4().hex[:12]
        dest_filename = f"{unique_id}_{original_name.replace(' ', '_')}"
        
        target_dir = self.videos_dir if media_type == "video" else self.photos_dir
        dest_path = os.path.join(target_dir, dest_filename)
        
        # Write file
        with open(dest_path, "wb") as f:
            f.write(file_bytes)
            
        file_size = len(file_bytes)
        width, height = 0, 0
        duration_seconds = 0.0
        
        thumb_name = f"thumb_{unique_id}.jpg"
        if media_type == "video":
            thumb_path = self.generate_thumbnail_video(dest_path, thumb_name)
            cap = cv2.VideoCapture(dest_path)
            if cap.isOpened():
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
                frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
                duration_seconds = round(frame_count / fps, 2)
                cap.release()
            # Extract faces from video keyframes
            faces_detected = face_engine.process_video_file(dest_path, interval_sec=settings.VIDEO_KEYFRAME_INTERVAL_SEC)
        else:
            thumb_path = self.generate_thumbnail_image(dest_path, thumb_name)
            try:
                with Image.open(dest_path) as img:
                    width, height = img.size
            except Exception:
                pass
            # Extract faces from photo
            faces_detected = face_engine.process_image_file(dest_path)

        # Store in Database
        with get_db() as conn:
            cursor = conn.cursor()
            # If event_id not provided, try to find active event
            if event_id is None:
                cursor.execute("SELECT id FROM events WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
                act_row = cursor.fetchone()
                if act_row:
                    event_id = act_row["id"]

            cursor.execute("""
                INSERT INTO media (
                    event_id, filename, original_name, media_type, file_path,
                    thumbnail_path, width, height, duration_seconds,
                    file_size, event_tag
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                dest_filename,
                original_name,
                media_type,
                dest_path,
                thumb_path,
                width,
                height,
                duration_seconds,
                file_size,
                event_tag
            ))
            media_id = cursor.lastrowid
            
            # Insert face detections
            for face in faces_detected:
                import json
                cursor.execute("""
                    INSERT INTO face_detections (
                        media_id, bounding_box, embedding, confidence, frame_timestamp
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    media_id,
                    json.dumps(face["bounding_box"]),
                    json.dumps(face["embedding"]),
                    face["confidence"],
                    face.get("frame_timestamp", 0.0)
                ))

        return {
            "media_id": media_id,
            "filename": dest_filename,
            "media_type": media_type,
            "faces_count": len(faces_detected),
            "width": width,
            "height": height,
            "duration": duration_seconds,
            "file_size": file_size,
            "event_tag": event_tag
        }

    def generate_signed_media_url(self, media_id: int, user_id: int) -> str:
        token = create_signed_media_token(media_id, user_id, expires_in_seconds=settings.SIGNED_URL_EXPIRE_SECONDS)
        return f"/api/gallery/media/{media_id}?token={token}"

    def generate_signed_thumb_url(self, media_id: int, user_id: int) -> str:
        token = create_signed_media_token(media_id, user_id, expires_in_seconds=settings.SIGNED_URL_EXPIRE_SECONDS)
        return f"/api/gallery/media/{media_id}/thumb?token={token}"

    def build_user_zip_archive(self, user_id: int, media_list: list[dict[str, Any]]) -> str:
        """
        Creates a secure ZIP archive containing all matched photos/videos for a user.
        """
        zip_id = uuid.uuid4().hex[:10]
        zip_filename = f"wedding_memories_{user_id}_{zip_id}.zip"
        zip_path = os.path.join(self.temp_dir, zip_filename)
        
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
            # Add celebratory README
            readme_content = f"""Event Memories — Wedding Photo Collection
===================================================
Wedding of {settings.COUPLE_NAMES}
Date: {settings.WEDDING_DATE[:10]}
Venue: {settings.VENUE_NAME}, {settings.VENUE_CITY}

Here are all the verified moments captured of you!
Crafted with love by Dipendra Pratap Singh.
Enjoy your memories!
"""
            zip_file.writestr("README.txt", readme_content)
            
            for item in media_list:
                file_path = item.get("file_path")
                if file_path and os.path.exists(file_path):
                    archive_name = item.get("original_name") or os.path.basename(file_path)
                    zip_file.write(file_path, arcname=f"photos/{archive_name}")
                    
        return zip_path

storage_service = StorageService()

import sqlite3
import json
import os
from contextlib import contextmanager
from typing import Generator, Any, Optional
from app.core.config import settings

DB_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "app_data.db")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                hashed_password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'guest',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 2. Events table (Created dynamically by Admin)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                couple_names TEXT NOT NULL,
                event_date TEXT NOT NULL,
                venue_name TEXT NOT NULL,
                venue_city TEXT NOT NULL,
                venue_map_url TEXT,
                description TEXT,
                story TEXT,
                cover_image_url TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Event Schedules / Sub-events (Haldi, Mehendi, Sangeet, Ceremony, etc.)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS event_schedules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                schedule_date TEXT NOT NULL,
                schedule_time TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT,
                is_main_event INTEGER DEFAULT 0,
                FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
            );
        """)

        # 4. User Faces table (Embeddings only, no raw biometrics)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_faces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                embedding TEXT NOT NULL,
                liveness_score REAL DEFAULT 1.0,
                consent_agreed INTEGER DEFAULT 1,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        
        # 5. Media table linked to event
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS media (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                media_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                thumbnail_path TEXT,
                width INTEGER DEFAULT 0,
                height INTEGER DEFAULT 0,
                duration_seconds REAL DEFAULT 0.0,
                file_size INTEGER DEFAULT 0,
                event_tag TEXT DEFAULT 'General',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 6. Face Detections in media
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS face_detections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                media_id INTEGER NOT NULL,
                bounding_box TEXT NOT NULL,
                embedding TEXT NOT NULL,
                cluster_id INTEGER DEFAULT -1,
                confidence REAL DEFAULT 0.9,
                frame_timestamp REAL DEFAULT 0.0,
                FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
            );
        """)
        
        # 7. Face Clusters
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS face_clusters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                label TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_detections_media ON face_detections(media_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_media_event ON media(event_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);")

        # Migrate media table for Google Drive sync columns
        for col in ["drive_file_id TEXT", "drive_view_link TEXT"]:
            try:
                cursor.execute(f"ALTER TABLE media ADD COLUMN {col};")
            except sqlite3.OperationalError:
                pass

def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict[str, Any]]:
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]

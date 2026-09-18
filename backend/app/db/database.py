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

    # Auto-restore data snapshot if table is empty
    restore_database_snapshot()

SNAPSHOT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data_snapshot.json")

def save_database_snapshot():
    """Export current events, schedules, and users to JSON snapshot for cloud persistence."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM events ORDER BY id ASC")
            events = rows_to_list(cursor.fetchall())
            for ev in events:
                cursor.execute("SELECT * FROM event_schedules WHERE event_id = ? ORDER BY id ASC", (ev["id"],))
                ev["schedules"] = rows_to_list(cursor.fetchall())
            
            cursor.execute("SELECT id, email, full_name, role, created_at FROM users WHERE role = 'guest'")
            guests = rows_to_list(cursor.fetchall())

            data = {
                "events": events,
                "guests": guests
            }
            with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("[SNAPSHOT] Saved database snapshot successfully.")
    except Exception as e:
        print(f"[SNAPSHOT_SAVE_ERR] {e}")

def restore_database_snapshot() -> bool:
    """Restore events and schedules from snapshot if DB is empty."""
    try:
        if not os.path.exists(SNAPSHOT_FILE):
            return False
        with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        events = data.get("events", [])
        if not events:
            return False
            
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM events")
            if cursor.fetchone()[0] == 0:
                for ev in events:
                    cursor.execute("""
                        INSERT INTO events (
                            title, couple_names, event_date, venue_name,
                            venue_city, venue_map_url, description, story, is_active
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        ev.get("title", ""),
                        ev.get("couple_names", ""),
                        ev.get("event_date", ""),
                        ev.get("venue_name", ""),
                        ev.get("venue_city", ""),
                        ev.get("venue_map_url", ""),
                        ev.get("description", ""),
                        ev.get("story", ""),
                        ev.get("is_active", 1)
                    ))
                    new_ev_id = cursor.lastrowid
                    for s in ev.get("schedules", []):
                        cursor.execute("""
                            INSERT INTO event_schedules (
                                event_id, title, schedule_date, schedule_time,
                                location, description, is_main_event
                            ) VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            new_ev_id,
                            s.get("title", ""),
                            s.get("schedule_date", ""),
                            s.get("schedule_time", ""),
                            s.get("location", ""),
                            s.get("description", ""),
                            s.get("is_main_event", 0)
                        ))
                print(f"[SNAPSHOT_RESTORE] Restored {len(events)} event(s) from snapshot.")
                return True
    except Exception as e:
        print(f"[SNAPSHOT_RESTORE_ERR] {e}")
    return False

def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict[str, Any]]:
    if row is None:
        return None
    return dict(row)

def rows_to_list(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.db.database import init_db, get_db, row_to_dict, rows_to_list
from app.db.seed import seed_sample_wedding_data
from app.api import auth, face, gallery, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed admin account
    init_db()
    seed_sample_wedding_data()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Live Face-Recognition Photo & Video Sharing Platform. Built by Dipendra Pratap Singh.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(face.router, prefix=settings.API_V1_STR)
app.include_router(gallery.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "creator": settings.DESIGNER_NAME,
        "docs_url": "/docs"
    }

@app.get("/api/events/active")
def get_active_event():
    """
    Public endpoint: returns the active wedding event created by the Admin.
    If no event exists yet, returns has_event: False.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
        act = cursor.fetchone()
        
        if not act:
            return {
                "has_event": False,
                "event": None,
                "schedules": [],
                "media_count": 0,
                "message": "No event has been created yet by the admin."
            }
            
        event_data = row_to_dict(act)
        cursor.execute("SELECT * FROM event_schedules WHERE event_id = ? ORDER BY id ASC", (event_data["id"],))
        schedules = rows_to_list(cursor.fetchall())
        
        cursor.execute("SELECT COUNT(*) as cnt FROM media WHERE event_id = ?", (event_data["id"],))
        media_count = cursor.fetchone()["cnt"]
        
    return {
        "has_event": True,
        "event": event_data,
        "schedules": schedules,
        "media_count": media_count
    }

@app.get("/api/info")
def get_wedding_info():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE is_active = 1 ORDER BY id DESC LIMIT 1")
        act = cursor.fetchone()
        if act:
            return {
                "has_event": True,
                "project_name": settings.PROJECT_NAME,
                "couple_names": act["couple_names"],
                "wedding_date": act["event_date"],
                "venue_name": act["venue_name"],
                "venue_city": act["venue_city"],
                "venue_map_url": act["venue_map_url"],
                "creator": settings.DESIGNER_NAME
            }
            
    return {
        "has_event": False,
        "project_name": settings.PROJECT_NAME,
        "creator": settings.DESIGNER_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

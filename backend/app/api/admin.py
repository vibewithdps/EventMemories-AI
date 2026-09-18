import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional, Any
from app.db.database import get_db, row_to_dict, rows_to_list
from app.services.face_engine import face_engine
from app.services.storage import storage_service
from app.api.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin Portal"])

class ScheduleItemCreate(BaseModel):
    title: str
    schedule_date: str
    schedule_time: str
    location: str
    description: Optional[str] = ""
    is_main_event: Optional[bool] = False

class EventCreateRequest(BaseModel):
    title: str
    couple_names: str
    event_date: str
    venue_name: str
    venue_city: str
    venue_map_url: Optional[str] = ""
    description: Optional[str] = ""
    story: Optional[str] = ""
    schedules: Optional[list[ScheduleItemCreate]] = []

class EventUpdateRequest(BaseModel):
    title: str
    couple_names: str
    event_date: str
    venue_name: str
    venue_city: str
    venue_map_url: Optional[str] = ""
    description: Optional[str] = ""
    story: Optional[str] = ""
    schedules: Optional[list[ScheduleItemCreate]] = None

class BatchDeleteMediaRequest(BaseModel):
    media_ids: list[int]

class TagClusterRequest(BaseModel):
    cluster_id: int
    label: str
    notes: Optional[str] = ""

class MergeClustersRequest(BaseModel):
    source_cluster_id: int
    target_cluster_id: int

# ==================== EVENT MANAGEMENT ENDPOINTS ====================

@router.get("/events")
def list_events(admin_user: dict[str, Any] = Depends(get_current_admin)):
    """List all events created by admin with schedule items and media count."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, 
                   (SELECT COUNT(*) FROM media m WHERE m.event_id = e.id) as media_count,
                   (SELECT COUNT(*) FROM event_schedules es WHERE es.event_id = e.id) as schedule_count
            FROM events e
            ORDER BY e.id DESC
        """)
        events = rows_to_list(cursor.fetchall())
        
        # Attach schedules for each event
        for ev in events:
            cursor.execute("SELECT * FROM event_schedules WHERE event_id = ? ORDER BY id ASC", (ev["id"],))
            ev["schedules"] = rows_to_list(cursor.fetchall())
            
    return {"events": events, "total": len(events)}

@router.post("/events")
def create_event(req: EventCreateRequest, admin_user: dict[str, Any] = Depends(get_current_admin)):
    """Create a new wedding event with schedule itinerary."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Deactivate previous events if this is set as active
        cursor.execute("UPDATE events SET is_active = 0")
        
        cursor.execute("""
            INSERT INTO events (
                title, couple_names, event_date, venue_name,
                venue_city, venue_map_url, description, story, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            req.title.strip(),
            req.couple_names.strip(),
            req.event_date.strip(),
            req.venue_name.strip(),
            req.venue_city.strip(),
            req.venue_map_url.strip() if req.venue_map_url else "",
            req.description.strip() if req.description else "",
            req.story.strip() if req.story else ""
        ))
        event_id = cursor.lastrowid
        
        # Insert schedule items
        for s in (req.schedules or []):
            cursor.execute("""
                INSERT INTO event_schedules (
                    event_id, title, schedule_date, schedule_time,
                    location, description, is_main_event
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                event_id,
                s.title.strip(),
                s.schedule_date.strip(),
                s.schedule_time.strip(),
                s.location.strip(),
                s.description.strip() if s.description else "",
                1 if s.is_main_event else 0
            ))
            
    return {
        "success": True,
        "message": f"Wedding event '{req.title}' created successfully!",
        "event_id": event_id
    }

@router.put("/events/{event_id}")
def update_event(event_id: int, req: EventUpdateRequest, admin_user: dict[str, Any] = Depends(get_current_admin)):
    """Update event information."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE events SET
                title = ?,
                couple_names = ?,
                event_date = ?,
                venue_name = ?,
                venue_city = ?,
                venue_map_url = ?,
                description = ?,
                story = ?
            WHERE id = ?
        """, (
            req.title.strip(),
            req.couple_names.strip(),
            req.event_date.strip(),
            req.venue_name.strip(),
            req.venue_city.strip(),
            req.venue_map_url.strip() if req.venue_map_url else "",
            req.description.strip() if req.description else "",
            req.story.strip() if req.story else "",
            event_id
        ))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")

        # Update schedules if provided
        if req.schedules is not None:
            cursor.execute("DELETE FROM event_schedules WHERE event_id = ?", (event_id,))
            for s in req.schedules:
                cursor.execute("""
                    INSERT INTO event_schedules (
                        event_id, title, schedule_date, schedule_time,
                        location, description, is_main_event
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    event_id,
                    s.title.strip(),
                    s.schedule_date.strip(),
                    s.schedule_time.strip(),
                    s.location.strip(),
                    s.description.strip() if s.description else "",
                    1 if s.is_main_event else 0
                ))
            
    return {"success": True, "message": "Event updated successfully"}

@router.delete("/events/{event_id}")
def delete_event(event_id: int, admin_user: dict[str, Any] = Depends(get_current_admin)):
    """Delete event, its schedules, and associated media."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM events WHERE id = ?", (event_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # If there's another event, activate the latest one
        cursor.execute("SELECT id FROM events ORDER BY id DESC LIMIT 1")
        next_ev = cursor.fetchone()
        if next_ev:
            cursor.execute("UPDATE events SET is_active = 1 WHERE id = ?", (next_ev["id"],))
            
    return {"success": True, "message": f"Event #{event_id} deleted"}

@router.post("/events/{event_id}/activate")
def activate_event(event_id: int, admin_user: dict[str, Any] = Depends(get_current_admin)):
    """Set specified event as the active showcase event."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE events SET is_active = 0")
        cursor.execute("UPDATE events SET is_active = 1 WHERE id = ?", (event_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Event not found")
            
    return {"success": True, "message": f"Event #{event_id} is now active"}

# ==================== MEDIA MANAGEMENT ====================

@router.post("/upload")
async def bulk_upload_media(
    files: list[UploadFile] = File(...),
    event_tag: str = Form("Ceremony"),
    event_id: Optional[int] = Form(None),
    admin_user: dict[str, Any] = Depends(get_current_admin)
):
    """
    Bulk upload endpoint for images and videos. Automatically extracts face embeddings.
    """
    results = []
    total_faces = 0
    
    for file in files:
        contents = await file.read()
        if not contents:
            continue
            
        saved_info = storage_service.save_media_file(
            file_bytes=contents,
            original_name=file.filename or "media_file.jpg",
            event_tag=event_tag,
            event_id=event_id
        )
        total_faces += saved_info["faces_count"]
        results.append(saved_info)
        
    return {
        "success": True,
        "uploaded_count": len(results),
        "total_faces_detected": total_faces,
        "items": results
    }

@router.get("/media")
def list_all_media(admin_user: dict[str, Any] = Depends(get_current_admin)):
    """
    List all media files uploaded by admin with face count and metadata.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.*, COUNT(fd.id) as faces_count, e.title as event_title
            FROM media m
            LEFT JOIN face_detections fd ON fd.media_id = m.id
            LEFT JOIN events e ON e.id = m.event_id
            GROUP BY m.id
            ORDER BY m.id DESC
        """)
        media_list = rows_to_list(cursor.fetchall())
        
        for item in media_list:
            cursor.execute("SELECT id, bounding_box, confidence, frame_timestamp FROM face_detections WHERE media_id = ?", (item["id"],))
            dets = rows_to_list(cursor.fetchall())
            for d in dets:
                d["bounding_box"] = json.loads(d["bounding_box"])
            item["detections"] = dets
            item["thumbnail_url"] = storage_service.generate_signed_thumb_url(item["id"], admin_user["id"])
            item["media_url"] = storage_service.generate_signed_media_url(item["id"], admin_user["id"])
            
    return {"media": media_list, "total": len(media_list)}

@router.delete("/media/{media_id}")
def delete_media(media_id: int, admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT file_path, thumbnail_path FROM media WHERE id = ?", (media_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Media not found")
            
        file_path = row["file_path"]
        thumb_path = row["thumbnail_path"]
        cursor.execute("DELETE FROM media WHERE id = ?", (media_id,))
        
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
    if thumb_path and os.path.exists(thumb_path) and thumb_path != file_path:
        try:
            os.remove(thumb_path)
        except Exception:
            pass
            
    return {"success": True, "message": f"Media #{media_id} and its face embeddings deleted"}

@router.post("/media/batch-delete")
def batch_delete_media(req: BatchDeleteMediaRequest, admin_user: dict[str, Any] = Depends(get_current_admin)):
    """Batch delete multiple photos or videos mistakenly uploaded."""
    if not req.media_ids:
        return {"success": True, "deleted_count": 0, "message": "No media IDs provided."}

    placeholders = ",".join("?" for _ in req.media_ids)
    files_to_remove = []

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"SELECT file_path, thumbnail_path FROM media WHERE id IN ({placeholders})", req.media_ids)
        rows = cursor.fetchall()
        for r in rows:
            if r["file_path"]:
                files_to_remove.append(r["file_path"])
            if r["thumbnail_path"] and r["thumbnail_path"] != r["file_path"]:
                files_to_remove.append(r["thumbnail_path"])

        cursor.execute(f"DELETE FROM media WHERE id IN ({placeholders})", req.media_ids)
        deleted_count = cursor.rowcount

    for path in files_to_remove:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": f"Successfully deleted {deleted_count} media items and purged face embeddings."
    }

@router.get("/clusters")
def get_face_clusters(admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT fd.id, fd.media_id, fd.bounding_box, fd.embedding, fd.confidence,
                   m.original_name, m.event_tag
            FROM face_detections fd
            JOIN media m ON m.id = fd.media_id
        """)
        detections = rows_to_list(cursor.fetchall())
        cursor.execute("SELECT * FROM face_clusters")
        cluster_tags = {r["id"]: dict(r) for r in cursor.fetchall()}
        
    clusters = face_engine.cluster_embeddings(detections)
    
    enriched_clusters = []
    for c in clusters:
        cid = c["cluster_id"]
        tag_info = cluster_tags.get(cid, {})
        sample_det = c["sample_detection"]
        mid = sample_det["media_id"]
        
        enriched_clusters.append({
            "cluster_id": cid,
            "label": tag_info.get("label", f"Cluster #{cid}"),
            "notes": tag_info.get("notes", ""),
            "size": c["size"],
            "sample_media_id": mid,
            "sample_box": json.loads(sample_det["bounding_box"]) if isinstance(sample_det["bounding_box"], str) else sample_det["bounding_box"],
            "sample_thumb_url": storage_service.generate_signed_thumb_url(mid, admin_user["id"]),
            "media_ids": list({d["media_id"] for d in c["detections"]})
        })
        
    return {"clusters": enriched_clusters, "total_clusters": len(enriched_clusters)}

@router.post("/clusters/tag")
def tag_cluster(req: TagClusterRequest, admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO face_clusters (id, label, notes)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                label = excluded.label,
                notes = excluded.notes
        """, (req.cluster_id, req.label, req.notes))
        
    return {"success": True, "message": f"Cluster #{req.cluster_id} tagged as '{req.label}'"}

@router.get("/users")
def get_users_activity(admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.id, u.email, u.full_name, u.role, u.created_at,
                   uf.updated_at as face_scanned_at,
                   uf.liveness_score,
                   (uf.id IS NOT NULL) as has_scanned
            FROM users u
            LEFT JOIN user_faces uf ON uf.user_id = u.id
            ORDER BY u.created_at DESC
        """)
        users = rows_to_list(cursor.fetchall())
        
    return {"users": users, "total": len(users)}

@router.get("/stats")
def get_admin_stats(admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as total_media FROM media")
        total_media = cursor.fetchone()["total_media"]
        
        cursor.execute("SELECT COUNT(*) as total_photos FROM media WHERE media_type = 'photo'")
        total_photos = cursor.fetchone()["total_photos"]
        
        cursor.execute("SELECT COUNT(*) as total_videos FROM media WHERE media_type = 'video'")
        total_videos = cursor.fetchone()["total_videos"]
        
        cursor.execute("SELECT COUNT(*) as total_faces FROM face_detections")
        total_faces = cursor.fetchone()["total_faces"]
        
        cursor.execute("SELECT COUNT(*) as total_guests FROM users WHERE role = 'guest'")
        total_guests = cursor.fetchone()["total_guests"]
        
        cursor.execute("SELECT COUNT(*) as scanned_guests FROM user_faces")
        scanned_guests = cursor.fetchone()["scanned_guests"]
        
        cursor.execute("SELECT SUM(file_size) as total_storage FROM media")
        total_storage = cursor.fetchone()["total_storage"] or 0

        cursor.execute("SELECT COUNT(*) as total_events FROM events")
        total_events = cursor.fetchone()["total_events"]
        
        # Get active event info if any
        cursor.execute("SELECT * FROM events WHERE is_active = 1 LIMIT 1")
        act = cursor.fetchone()
        active_event = row_to_dict(act) if act else None
        
    return {
        "total_media": total_media,
        "total_photos": total_photos,
        "total_videos": total_videos,
        "total_faces": total_faces,
        "total_guests": total_guests,
        "scanned_guests": scanned_guests,
        "total_events": total_events,
        "total_storage_mb": round(total_storage / (1024 * 1024), 2),
        "active_event": active_event
    }

@router.post("/purge-biometrics")
def purge_biometrics(admin_user: dict[str, Any] = Depends(get_current_admin)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_faces")
        purged_count = cursor.rowcount
        
    return {
        "success": True,
        "message": f"Biometric data retention policy executed. Purged {purged_count} guest face embeddings."
    }

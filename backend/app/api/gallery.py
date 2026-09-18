import os
import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from typing import Optional, Any
from app.db.database import get_db, row_to_dict, rows_to_list
from app.services.face_engine import face_engine
from app.services.storage import storage_service
from app.core.security import verify_signed_media_token
from app.api.auth import get_current_user

router = APIRouter(prefix="/gallery", tags=["Gallery & Downloads"])

@router.get("/my-photos")
def get_my_photos(current_user: dict[str, Any] = Depends(get_current_user)):
    """
    Returns ONLY the media files that match the authenticated user's face embedding.
    Access is strictly checked and signed URLs are generated.
    """
    user_id = current_user["id"]
    
    with get_db() as conn:
        cursor = conn.cursor()
        # Retrieve user's face embedding
        cursor.execute("SELECT embedding, updated_at FROM user_faces WHERE user_id = ?", (user_id,))
        user_face_row = cursor.fetchone()
        
        if not user_face_row:
            return {
                "has_scanned": False,
                "photos": [],
                "total_count": 0,
                "message": "Please scan your face first to discover your wedding memories."
            }
            
        user_embedding = json.loads(user_face_row["embedding"])
        
        # Query all face detections
        cursor.execute("""
            SELECT fd.id, fd.media_id, fd.embedding, m.media_type, m.original_name, m.event_tag
            FROM face_detections fd
            JOIN media m ON m.id = fd.media_id
        """)
        stored_detections = rows_to_list(cursor.fetchall())
        
    # Match using cosine similarity
    matched_items = face_engine.match_face(user_embedding, stored_detections)
    matched_media_ids = [item["media_id"] for item in matched_items]
    scores_by_id = {item["media_id"]: item["max_score"] for item in matched_items}
    
    if not matched_media_ids:
        return {
            "has_scanned": True,
            "photos": [],
            "total_count": 0,
            "message": "No photos found matching your face in the current album. More photos may be uploaded soon!"
        }
        
    # Fetch full media metadata for matched IDs
    placeholders = ",".join("?" for _ in matched_media_ids)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT id, filename, original_name, media_type, file_path, thumbnail_path,
                   width, height, duration_seconds, file_size, event_tag, created_at
            FROM media
            WHERE id IN ({placeholders})
        """, matched_media_ids)
        media_records = rows_to_list(cursor.fetchall())
        
    # Format records with time-limited signed download & preview URLs
    results = []
    for item in media_records:
        mid = item["id"]
        signed_url = storage_service.generate_signed_media_url(mid, user_id)
        signed_thumb_url = storage_service.generate_signed_thumb_url(mid, user_id)
        
        raw_sim = scores_by_id.get(mid, 0.35)
        confidence_pct = round(min(99.0, max(75.0, 75.0 + (raw_sim - 0.35) / 0.25 * 24.0)), 1)
        
        results.append({
            "id": mid,
            "original_name": item["original_name"],
            "media_type": item["media_type"],
            "width": item["width"],
            "height": item["height"],
            "duration_seconds": item["duration_seconds"],
            "file_size": item["file_size"],
            "event_tag": item["event_tag"],
            "created_at": item["created_at"],
            "match_confidence": confidence_pct,
            "media_url": signed_url,
            "thumbnail_url": signed_thumb_url
        })
        
    # Sort by match confidence descending
    results.sort(key=lambda x: x["match_confidence"], reverse=True)
    
    return {
        "has_scanned": True,
        "photos": results,
        "total_count": len(results),
        "message": f"Found {len(results)} verified moments featuring you!"
    }

@router.get("/media/{media_id}")
def serve_media(
    media_id: int,
    token: str = Query(..., description="Cryptographically signed access token"),
    download: bool = Query(False, description="Trigger browser download attachment")
):
    """
    Secure endpoint to serve high-res media. Strictly verifies signed token.
    Direct manipulation of media_id without valid token causes 403 Forbidden.
    """
    is_valid = verify_signed_media_token(token, media_id)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid, expired, or unauthorized signed media token."
        )
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT file_path, original_name, media_type FROM media WHERE id = ?", (media_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Media file not found.")
            
    file_path = row["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Media file on disk was not found.")
        
    media_type = "video/mp4" if row["media_type"] == "video" else "image/jpeg"
    disposition = "attachment" if download else "inline"
    filename = row["original_name"]
    
    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'{disposition}; filename="{filename}"'}
    )

@router.get("/media/{media_id}/thumb")
def serve_thumbnail(
    media_id: int,
    token: str = Query(..., description="Cryptographically signed access token")
):
    """
    Secure endpoint to serve media thumbnail. Validates signed token.
    """
    is_valid = verify_signed_media_token(token, media_id)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Invalid or expired signed thumbnail token."
        )
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT thumbnail_path, file_path FROM media WHERE id = ?", (media_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Media not found.")
            
    thumb_path = row["thumbnail_path"] or row["file_path"]
    if not os.path.exists(thumb_path):
        thumb_path = row["file_path"]
        
    return FileResponse(path=thumb_path, media_type="image/jpeg")

@router.get("/download-zip")
def download_matched_zip(current_user: dict[str, Any] = Depends(get_current_user)):
    """
    Server-side enforced ZIP download: bundles ONLY the media verified to contain this user's face.
    """
    user_id = current_user["id"]
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT embedding FROM user_faces WHERE user_id = ?", (user_id,))
        face_row = cursor.fetchone()
        if not face_row:
            raise HTTPException(status_code=400, detail="Please scan your face first to find your memories.")
            
        user_embedding = json.loads(face_row["embedding"])
        
        cursor.execute("""
            SELECT fd.id, fd.media_id, fd.embedding
            FROM face_detections fd
        """)
        stored_detections = rows_to_list(cursor.fetchall())
        
    matched = face_engine.match_face(user_embedding, stored_detections)
    if not matched:
        raise HTTPException(status_code=404, detail="No matched photos found to download.")
        
    matched_ids = [m["media_id"] for m in matched]
    placeholders = ",".join("?" for _ in matched_ids)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT id, file_path, original_name
            FROM media
            WHERE id IN ({placeholders})
        """, matched_ids)
        matched_files = rows_to_list(cursor.fetchall())
        
    zip_path = storage_service.build_user_zip_archive(user_id, matched_files)
    safe_name = current_user["full_name"].replace(" ", "_")
    
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=f"Wedding_Memories_{safe_name}.zip",
        headers={"Content-Disposition": f'attachment; filename="Wedding_Memories_{safe_name}.zip"'}
    )

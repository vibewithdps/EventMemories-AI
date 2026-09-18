import json
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Any
from app.db.database import get_db, row_to_dict, rows_to_list
from app.services.face_engine import face_engine
from app.services.storage import storage_service
from app.api.auth import get_current_user

router = APIRouter(prefix="/face", tags=["Face Recognition"])

class ScanAndMatchRequest(BaseModel):
    frames: list[str]  # List of base64 images from webcam
    consent: bool = True

class ConsentRequest(BaseModel):
    consent: bool = True

@router.post("/scan-and-match")
def scan_and_match(req: ScanAndMatchRequest, current_user: dict[str, Any] = Depends(get_current_user)):
    if not req.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Facial scanning requires your explicit privacy consent."
        )
        
    if not req.frames:
        raise HTTPException(status_code=400, detail="No webcam frames received.")
        
    # Decode incoming base64 frames
    decoded_frames = []
    for b64 in req.frames:
        frame_bgr = face_engine.decode_base64_image(b64)
        if frame_bgr is not None:
            decoded_frames.append(frame_bgr)
            
    if not decoded_frames:
        raise HTTPException(status_code=400, detail="Failed to decode camera frames.")
        
    # Perform liveness check across frames
    liveness = face_engine.verify_liveness(decoded_frames)
    if not liveness["is_live"]:
        return {
            "success": False,
            "error": "Liveness verification failed. Please ensure adequate lighting and align your face in the oval.",
            "liveness": liveness,
            "matched_count": 0,
            "matches": []
        }
        
    # Multi-frame feature extraction with SFace landmark alignment
    frame_embeddings = []
    for frame in decoded_frames:
        frame_detections = face_engine.detect_faces(frame)
        if frame_detections:
            bf = max(frame_detections, key=lambda d: d["box"][2] * d["box"][3])
            emb = face_engine.extract_embedding(frame, bf["box"], bf.get("raw_face"))
            if emb and len(emb) == 128:
                frame_embeddings.append(np.array(emb, dtype=np.float32))

    if not frame_embeddings:
        return {
            "success": False,
            "error": "No clear face detected. Please position your face inside the golden oval with good lighting.",
            "liveness": liveness,
            "matched_count": 0,
            "matches": []
        }

    # Normalize fused average embedding across frames
    avg_vec = np.mean(frame_embeddings, axis=0)
    norm = np.linalg.norm(avg_vec)
    if norm > 1e-6:
        avg_vec = avg_vec / norm
    embedding = avg_vec.tolist()
    
    # Store or update the user's embedding in database (numerical vector only!)
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_faces (user_id, embedding, liveness_score, consent_agreed, updated_at)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                embedding = excluded.embedding,
                liveness_score = excluded.liveness_score,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, json.dumps(embedding), liveness["score"]))
        
        # Query all stored face detections across media
        cursor.execute("""
            SELECT fd.id, fd.media_id, fd.embedding, m.media_type, m.original_name, m.event_tag
            FROM face_detections fd
            JOIN media m ON m.id = fd.media_id
        """)
        stored_detections = rows_to_list(cursor.fetchall())
        
    # Match query embedding against all stored detections
    matched_media = face_engine.match_face(embedding, stored_detections)
    
    # Generate signed URLs for each matched media
    matches_payload = []
    for item in matched_media:
        mid = item["media_id"]
        matches_payload.append({
            "media_id": mid,
            "confidence": round(item["max_score"] * 100, 1),
            "score": item["max_score"],
            "signed_url": storage_service.generate_signed_media_url(mid, user_id),
            "thumb_url": storage_service.generate_signed_thumb_url(mid, user_id),
        })

    return {
        "success": True,
        "message": f"Successfully matched {len(matches_payload)} memories containing your face!",
        "matched_count": len(matches_payload),
        "matches": matches_payload,
        "liveness": liveness
    }

@router.delete("/my-face")
def delete_my_face_data(current_user: dict[str, Any] = Depends(get_current_user)):
    """User-initiated right-to-be-forgotten / biometric deletion."""
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM user_faces WHERE user_id = ?", (user_id,))
    return {"success": True, "message": "Your biometric embedding data has been permanently deleted."}

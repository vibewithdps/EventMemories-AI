import sys
import os
import json
import base64
import numpy as np
import cv2

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import init_db, get_db, rows_to_list
from app.db.seed import seed_sample_wedding_data
from app.core.security import (
    create_access_token, decode_access_token,
    create_signed_media_token, verify_signed_media_token,
    verify_password
)
from app.services.face_engine import face_engine

def run_tests():
    print("=== 1. Testing DB Initialization and Seeding ===")
    init_db()
    seed_sample_wedding_data()
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, role, full_name FROM users")
        users = rows_to_list(cursor.fetchall())
        print(f"Users found: {len(users)}")
        for u in users:
            print(f" - {u['email']} ({u['role']}): {u['full_name']}")
            
        cursor.execute("SELECT id, filename, media_type, event_tag FROM media")
        media = rows_to_list(cursor.fetchall())
        print(f"Media files found: {len(media)}")
        
        cursor.execute("SELECT COUNT(*) as cnt FROM face_detections")
        total_faces = cursor.fetchone()["cnt"]
        print(f"Total face detections indexed: {total_faces}")
        assert len(media) > 0, "No media generated!"
        assert total_faces > 0, "No faces detected in seeded media!"

    print("\n=== 2. Testing Security & Tokens ===")
    token = create_access_token(subject=1, role="admin")
    payload = decode_access_token(token)
    assert payload is not None, "Failed to decode access token"
    assert payload["sub"] == "1" and payload["role"] == "admin"
    print("Access token created & validated successfully!")
    
    signed_token = create_signed_media_token(media_id=42, user_id=10, expires_in_seconds=300)
    assert verify_signed_media_token(signed_token, expected_media_id=42, expected_user_id=10)
    assert not verify_signed_media_token(signed_token, expected_media_id=99, expected_user_id=10)
    print("Signed media URL security token verified successfully!")

    print("\n=== 3. Testing Face Recognition Engine & Vector Matching ===")
    # Test synthetic webcam face
    test_img = np.zeros((400, 400, 3), dtype=np.uint8)
    # Draw face
    from app.db.seed import draw_synthetic_face
    draw_synthetic_face(test_img, 200, 200, 80)
    
    dets = face_engine.detect_faces(test_img)
    print(f"Detected faces in test frame: {len(dets)}")
    assert len(dets) > 0, "Face detection failed on synthetic portrait"
    
    emb = face_engine.extract_embedding(test_img, dets[0]["box"])
    assert len(emb) == 128, f"Expected 128-dim vector, got {len(emb)}"
    
    norm = np.linalg.norm(np.array(emb))
    assert abs(norm - 1.0) < 1e-3, f"Embedding not unit-normalized: {norm}"
    print(f"128-d unit vector extracted. Norm: {norm:.4f}")
    
    # Test matching against stored detections
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, media_id, embedding FROM face_detections")
        stored = rows_to_list(cursor.fetchall())
        
    matches = face_engine.match_face(emb, stored, threshold=0.55)
    print(f"Face matches found in album: {len(matches)}")
    for m in matches[:3]:
        print(f" - Media ID: {m['media_id']}, Confidence Score: {m['max_score'] * 100:.1f}%")
        
    print("\n=== 4. Testing Liveness Verification ===")
    liveness = face_engine.verify_liveness([test_img, test_img])
    print(f"Liveness result: {liveness}")
    
    print("\nAll Backend Core Verification Tests PASSED Successfully!")

if __name__ == "__main__":
    run_tests()

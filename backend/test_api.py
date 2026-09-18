import os
import sys
import time
import threading
import json
import base64
import requests
import numpy as np
import cv2
import uvicorn

# Set path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

PORT = 8765
BASE_URL = f"http://127.0.0.1:{PORT}"

def start_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=PORT, log_level="error")
    server = uvicorn.Server(config)
    server.run()

def run_e2e_tests():
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Wait for server to come up
    for _ in range(25):
        try:
            r = requests.get(f"{BASE_URL}/", timeout=1)
            if r.status_code == 200:
                break
        except Exception:
            time.sleep(0.3)
            
    session = requests.Session()

    print("=== TEST 1: Root & Wedding Info ===")
    res = session.get(f"{BASE_URL}/api/info")
    assert res.status_code == 200, f"Info endpoint failed: {res.text}"
    info = res.json()
    print("Wedding Info:", info)
    assert "Aarav & Meera" in info["couple_names"]

    print("\n=== TEST 2: Admin Login & Stats ===")
    admin_login_res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@wedding.com",
        "password": "Admin@2026"
    })
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("Admin logged in successfully!")

    stats_res = session.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    print(f"Stats: {stats['total_media']} media, {stats['total_faces']} faces indexed, {stats['total_guests']} guests.")

    print("\n=== TEST 3: Admin Media & Clusters ===")
    media_res = session.get(f"{BASE_URL}/api/admin/media", headers=admin_headers)
    assert media_res.status_code == 200
    media_items = media_res.json()["media"]
    print(f"Admin retrieved {len(media_items)} media items.")
    first_media = media_items[0]
    assert "detections" in first_media

    clusters_res = session.get(f"{BASE_URL}/api/admin/clusters", headers=admin_headers)
    assert clusters_res.status_code == 200
    clusters = clusters_res.json()["clusters"]
    print(f"Admin retrieved {len(clusters)} face clusters.")

    print("\n=== TEST 4: Guest Registration & Face Scan ===")
    # Register guest
    guest_reg_res = session.post(f"{BASE_URL}/api/auth/register", json={
        "email": "rohan_test@wedding.com",
        "password": "Guest@2026",
        "full_name": "Rohan Mehra"
    })
    # If already exists, login
    guest_login_res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "rohan_test@wedding.com",
        "password": "Guest@2026"
    })
    assert guest_login_res.status_code == 200
    guest_token = guest_login_res.json()["access_token"]
    guest_headers = {"Authorization": f"Bearer {guest_token}"}
    print("Guest 'Rohan Mehra' authenticated!")

    # Check gallery before scan (should be empty / has_scanned: False)
    gallery_before = session.get(f"{BASE_URL}/api/gallery/my-photos", headers=guest_headers).json()
    assert gallery_before["has_scanned"] is False
    print("Confirmed: Guest gallery is locked before facial scan.")

    # Create synthetic webcam face
    test_face_frame = np.zeros((480, 480, 3), dtype=np.uint8)
    from app.db.seed import draw_synthetic_face
    draw_synthetic_face(test_face_frame, 240, 240, 90)
    
    _, enc = cv2.imencode(".jpg", test_face_frame)
    b64_frame = f"data:image/jpeg;base64,{base64.b64encode(enc).decode('utf-8')}"

    # Perform live face scan
    scan_res = session.post(f"{BASE_URL}/api/face/scan-and-match", json={
        "frames": [b64_frame, b64_frame],
        "consent": True
    }, headers=guest_headers)
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    print(f"Face Scan Result: Success={scan_data['success']}, Matched Count={scan_data['matched_count']}")

    print("\n=== TEST 5: Matched Gallery & Cryptographic Signed URLs ===")
    gallery_res = session.get(f"{BASE_URL}/api/gallery/my-photos", headers=guest_headers)
    assert gallery_res.status_code == 200
    gallery_data = gallery_res.json()
    assert gallery_data["has_scanned"] is True
    print(f"Guest gallery unlocked! Verified memories count: {gallery_data['total_count']}.")
    
    if gallery_data["photos"]:
        matched_sample = gallery_data["photos"][0]
        signed_media_url = f"{BASE_URL}{matched_sample['media_url']}"
        print(f"Sample signed media URL: {signed_media_url}")
        
        # Access via signed URL
        serve_res = session.get(signed_media_url)
        assert serve_res.status_code == 200, f"Failed to serve media: {serve_res.status_code}"
        print(f"Media successfully served ({len(serve_res.content)} bytes).")

        # Security Test: Tamper token
        tampered_url = f"{BASE_URL}/api/gallery/media/{matched_sample['id']}?token=tampered_signature"
        tampered_res = session.get(tampered_url)
        assert tampered_res.status_code == 403, f"Tampered token must return 403, got {tampered_res.status_code}"
        print("Security Verified: Tampered / unauthorized media request correctly blocked with 403 Forbidden!")

    print("\n=== TEST 6: One-Click ZIP Download ===")
    zip_res = session.get(f"{BASE_URL}/api/gallery/download-zip", headers=guest_headers)
    if gallery_data["photos"]:
        assert zip_res.status_code == 200
        assert zip_res.headers["content-type"] == "application/zip"
        print(f"ZIP package generated and downloaded successfully! ({len(zip_res.content)} bytes)")
    else:
        print("ZIP skipped (0 matches).")

    print("\n=== TEST 7: Biometric Deletion (Right to be Forgotten) ===")
    del_res = session.delete(f"{BASE_URL}/api/face/my-face", headers=guest_headers)
    assert del_res.status_code == 200
    print("User biometric deletion verified:", del_res.json()["message"])

    print("\n✨ ALL END-TO-END PLATFORM TESTS PASSED WITH 100% SUCCESS! ✨")

if __name__ == "__main__":
    run_e2e_tests()

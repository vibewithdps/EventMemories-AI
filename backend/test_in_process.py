import os
import sys
import json
import base64
import numpy as np
import cv2

# Set path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import app.db.database as db_mod
db_mod.DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_app_data.db")

from app.db.database import init_db, get_db
from app.db.seed import seed_sample_wedding_data
from app.api.auth import register, login, RegisterRequest, LoginRequest
from app.api.admin import (
    list_all_media, get_admin_stats, get_face_clusters, get_users_activity,
    create_event, list_events, EventCreateRequest, ScheduleItemCreate
)
from app.api.face import scan_and_match, ScanAndMatchRequest, delete_my_face_data
from app.api.gallery import get_my_photos, serve_media, download_matched_zip
from app.core.security import verify_signed_media_token
from app.main import get_active_event

def draw_test_face(img: np.ndarray, cx: int, cy: int, r: int):
    cv2.ellipse(img, (cx, cy), (r, int(r * 1.25)), 0, 0, 360, (180, 210, 240), -1)
    cv2.ellipse(img, (cx, cy - int(r * 0.4)), (r + 8, int(r * 0.9)), 0, 180, 360, (25, 20, 20), -1)
    eye_ox, eye_oy = int(r * 0.4), int(r * 0.15)
    cv2.ellipse(img, (cx - eye_ox, cy - eye_oy), (12, 8), 0, 0, 360, (250, 250, 250), -1)
    cv2.ellipse(img, (cx + eye_ox, cy - eye_oy), (12, 8), 0, 0, 360, (250, 250, 250), -1)
    cv2.circle(img, (cx - eye_ox, cy - eye_oy), 4, (20, 15, 10), -1)
    cv2.circle(img, (cx + eye_ox, cy - eye_oy), 4, (20, 15, 10), -1)
    cv2.line(img, (cx, cy - 5), (cx, cy + int(r * 0.25)), (140, 170, 200), 2)
    lip_y = cy + int(r * 0.5)
    cv2.ellipse(img, (cx, lip_y), (int(r * 0.35), int(r * 0.18)), 0, 0, 180, (60, 50, 190), -1)

def test_dynamic_event_flow():
    print("=== TEST 1: DB Initialization (Zero default events) ===")
    init_db()
    seed_sample_wedding_data()
    
    # Clear events for fresh test
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM events")
        cursor.execute("DELETE FROM event_schedules")

    # Verify active event is initially empty
    active_check = get_active_event()
    print("Initial active event check:", active_check)
    assert active_check["has_event"] is False, "Expected 0 events by default!"

    print("\n=== TEST 2: Admin Login & Event Creation ===")
    admin_login_res = login(LoginRequest(email="thakurdps795@gmail.com", password="788052"))
    admin_user = admin_login_res["user"]
    print("Admin login success:", admin_user["email"])

    # Admin creates a new wedding event
    new_event_res = create_event(
        EventCreateRequest(
            title="Aarav & Meera's Wedding 2026",
            couple_names="Aarav & Meera",
            event_date="2026-11-20T17:00",
            venue_name="The Grand Palace & Lake Pavilions",
            venue_city="Udaipur, Rajasthan",
            venue_map_url="https://maps.google.com/?q=Udaipur+Palace",
            description="Royal heritage wedding celebration.",
            story="A timeless journey of love in Udaipur.",
            schedules=[
                ScheduleItemCreate(
                    title="Haldi Rasam",
                    schedule_date="Nov 18, 2026",
                    schedule_time="10:30 AM",
                    location="Courtyard Pavilions",
                    description="Turmeric ceremony & traditional music",
                    is_main_event=False
                ),
                ScheduleItemCreate(
                    title="Wedding Ceremony",
                    schedule_date="Nov 20, 2026",
                    schedule_time="05:00 PM",
                    location="Lake Palace Mandap",
                    description="Varmala and sacred pheras",
                    is_main_event=True
                )
            ]
        ),
        admin_user=admin_user
    )
    print("Event creation response:", new_event_res)
    assert new_event_res["success"] is True
    event_id = new_event_res["event_id"]

    # Now verify active event endpoint returns the created event!
    active_now = get_active_event()
    print("Active event after admin creation:", active_now["event"]["couple_names"])
    assert active_now["has_event"] is True
    assert active_now["event"]["couple_names"] == "Aarav & Meera"
    assert len(active_now["schedules"]) == 2

    print("\n=== TEST 3: Admin Events List ===")
    events_list_res = list_events(admin_user=admin_user)
    print(f"Total events in admin list: {events_list_res['total']}")
    assert events_list_res["total"] == 1

    print("\n=== TEST 4: Guest Experience With Active Event ===")
    try:
        reg_res = register(RegisterRequest(
            email="priya_guest@wedding.com",
            password="Guest@2026",
            full_name="Priya Sharma"
        ))
        guest_user = reg_res["user"]
    except Exception:
        login_res = login(LoginRequest(email="priya_guest@wedding.com", password="Guest@2026"))
        guest_user = login_res["user"]
    print("Guest logged in:", guest_user["full_name"])

    # Live face scan with sensor delta
    test_face1 = np.zeros((400, 400, 3), dtype=np.uint8)
    draw_test_face(test_face1, 200, 200, 75)
    test_face2 = np.clip(test_face1.astype(np.int16) + 3, 0, 255).astype(np.uint8)
    
    _, enc1 = cv2.imencode(".jpg", test_face1)
    _, enc2 = cv2.imencode(".jpg", test_face2)
    b64_1 = f"data:image/jpeg;base64,{base64.b64encode(enc1).decode('utf-8')}"
    b64_2 = f"data:image/jpeg;base64,{base64.b64encode(enc2).decode('utf-8')}"

    scan_res = scan_and_match(
        ScanAndMatchRequest(frames=[b64_1, b64_2], consent=True),
        current_user=guest_user
    )
    print("Face scan result:", scan_res["success"], "Liveness:", scan_res["liveness"]["reason"])
    assert scan_res["success"] is True

    print("\n🎉 ALL DYNAMIC EVENT AND ADMIN TESTS PASSED! 🎉")

if __name__ == "__main__":
    test_dynamic_event_flow()

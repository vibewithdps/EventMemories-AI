from app.core.security import get_password_hash
from app.db.database import get_db

def seed_sample_wedding_data():
    """
    Ensures ONLY the authorized Admin account exists:
    Email: thakurdps795@gmail.com
    Password: (hashed 788052)
    All dummy media, dummy guests, and dummy events remain completely purged.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Remove any legacy dummy admin or guest accounts
        cursor.execute("DELETE FROM users WHERE email IN ('admin@wedding.com', 'priya@wedding.com', 'rohan@wedding.com', 'meera_guest@wedding.com', 'meera_guest2@wedding.com', 'meera_guest3@wedding.com')")
        
        # Check if the sole admin exists
        admin_email = "thakurdps795@gmail.com"
        cursor.execute("SELECT id FROM users WHERE email = ?", (admin_email,))
        row = cursor.fetchone()
        if not row:
            cursor.execute(
                "INSERT INTO users (email, hashed_password, full_name, role) VALUES (?, ?, ?, ?)",
                (admin_email, get_password_hash("788052"), "Dipendra Pratap Singh (Admin)", "admin")
            )
            print(f"[SEED] Sole admin account initialized: {admin_email}")
        else:
            # Ensure password is up to date
            cursor.execute(
                "UPDATE users SET hashed_password = ?, role = 'admin' WHERE email = ?",
                (get_password_hash("788052"), admin_email)
            )

        # Ensure at least one active wedding event exists
        cursor.execute("SELECT COUNT(*) FROM events")
        ev_count = cursor.fetchone()[0]
        if ev_count == 0:
            cursor.execute("""
                INSERT INTO events (
                    title, couple_names, event_date, venue_name,
                    venue_city, venue_map_url, description, story, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                "The Royal Wedding Celebration",
                "Rahul & Priya",
                "2026-11-20T17:00",
                "The Leela Palace & Royal Courtyard",
                "Udaipur, Rajasthan",
                "https://maps.google.com/?q=The+Leela+Palace+Udaipur",
                "A magnificent celebration of love, culture, and royal heritage.",
                "Welcome to our wedding celebration! We are delighted to share these joyous moments with all our beloved family and friends."
            ))
            event_id = cursor.lastrowid
            schedules = [
                ("Haldi & Mehendi Rituals", "2026-11-19", "10:00", "Lakeside Lawn", "Traditional turmeric ceremony and henna celebration.", 0),
                ("Sangeet & Musical Evening", "2026-11-19", "19:00", "Grand Ballroom", "A night of energetic dance, music, and festivities.", 0),
                ("Grand Varmala & Royal Pheras", "2026-11-20", "18:00", "Royal Mandap", "The sacred union and pheras under the starlit sky.", 1),
                ("Gala Reception Dinner", "2026-11-20", "20:30", "Palace Courtyard", "A regal banquet and toast to the newlyweds.", 0)
            ]
            for s in schedules:
                cursor.execute("""
                    INSERT INTO event_schedules (
                        event_id, title, schedule_date, schedule_time,
                        location, description, is_main_event
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (event_id, s[0], s[1], s[2], s[3], s[4], s[5]))
            print(f"[SEED] Default permanent wedding event initialized (ID: {event_id})")

        # Ensure at least one event is marked active
        cursor.execute("SELECT COUNT(*) FROM events WHERE is_active = 1")
        if cursor.fetchone()[0] == 0:
            cursor.execute("SELECT id FROM events ORDER BY id DESC LIMIT 1")
            act_ev = cursor.fetchone()
            if act_ev:
                cursor.execute("UPDATE events SET is_active = 1 WHERE id = ?", (act_ev[0],))

    # Persist initial state to snapshot file
    from app.db.database import save_database_snapshot
    save_database_snapshot()

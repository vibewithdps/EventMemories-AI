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

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Any
import re
from app.db.database import get_db, row_to_dict
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
security = HTTPBearer(auto_error=False)

def validate_email_format(email: str) -> bool:
    pattern = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return bool(re.match(pattern, email.strip()))

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "guest"

class LoginRequest(BaseModel):
    email: str
    password: str

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict[str, Any]:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization token")
        
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
        
    user_id = int(payload["sub"])
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, role, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user = row_to_dict(row)
        
    return user

def get_current_admin(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

@router.post("/register")
def register(req: RegisterRequest):
    email_clean = req.email.lower().strip()
    if not validate_email_format(email_clean):
        raise HTTPException(status_code=400, detail="Invalid email format")
        
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (email_clean,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="An account with this email already exists")
            
        hashed_pwd = get_password_hash(req.password)
        role = req.role if req.role in ["guest", "admin"] else "guest"
        
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name, role) VALUES (?, ?, ?, ?)",
            (email_clean, hashed_pwd, req.full_name.strip(), role)
        )
        user_id = cursor.lastrowid
        
    token = create_access_token(subject=user_id, role=role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email_clean,
            "full_name": req.full_name.strip(),
            "role": role
        }
    }

@router.post("/login")
def login(req: LoginRequest):
    email_clean = req.email.lower().strip()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, hashed_password, full_name, role FROM users WHERE email = ?", (email_clean,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
        user = row_to_dict(row)
        if not verify_password(req.password, user["hashed_password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
            
    token = create_access_token(subject=user["id"], role=user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@router.get("/me")
def get_me(current_user: dict[str, Any] = Depends(get_current_user)):
    user_id = current_user["id"]
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT updated_at, consent_agreed FROM user_faces WHERE user_id = ?", (user_id,))
        face_row = cursor.fetchone()
        
    has_face_scan = face_row is not None
    last_scan_date = face_row["updated_at"] if face_row else None
    
    return {
        "user": current_user,
        "has_face_scan": has_face_scan,
        "last_scan_date": last_scan_date
    }

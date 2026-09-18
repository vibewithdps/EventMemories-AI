import time
import hmac
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
from jose import jwt, JWTError
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8")[:72], hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(subject: str | Any, role: str = "guest", expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def create_signed_media_token(media_id: int, user_id: int, expires_in_seconds: int = 900) -> str:
    """
    Generate an HMAC-SHA256 signature for a media file that expires after expires_in_seconds.
    Format: {media_id}.{user_id}.{exp_timestamp}.{signature}
    """
    exp_time = int(time.time()) + expires_in_seconds
    message = f"{media_id}:{user_id}:{exp_time}"
    signature = hmac.new(
        settings.SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()[:24]
    return f"{media_id}.{user_id}.{exp_time}.{signature}"

def verify_signed_media_token(token_str: str, expected_media_id: int, expected_user_id: Optional[int] = None) -> bool:
    """
    Verify the signed media token. Validates timestamp and HMAC signature.
    """
    try:
        parts = token_str.split(".")
        if len(parts) != 4:
            return False
        media_id_str, user_id_str, exp_str, signature = parts
        media_id = int(media_id_str)
        user_id = int(user_id_str)
        exp_time = int(exp_str)
        
        # Check media id match
        if media_id != expected_media_id:
            return False
        
        # Check user id match if expected_user_id is provided
        if expected_user_id is not None and user_id != expected_user_id:
            return False
            
        # Check expiry
        if time.time() > exp_time:
            return False
            
        message = f"{media_id}:{user_id}:{exp_time}"
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()[:24]
        
        return hmac.compare_digest(signature, expected_sig)
    except Exception:
        return False

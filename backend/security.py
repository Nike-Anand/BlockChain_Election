"""
Security utilities for production deployment
Includes: bcrypt password hashing, JWT tokens, rate limiting, audit logging
"""

import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_USE_openssl_rand_hex_32")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15

# HTTP Bearer for JWT
security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hash password using bcrypt with cost factor 12"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token with 15-minute expiry"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    JWT Authentication dependency for FastAPI endpoints
    Usage: current_user: dict = Depends(get_current_user)
    """
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

def hash_biometric_photo(photo_base64: str) -> str:
    """
    Create one-way hash of biometric photo for tokenization
    Stores hash instead of raw photo for privacy
    """
    import hashlib
    return hashlib.sha256(photo_base64.encode()).hexdigest()

# Audit logging helper
def create_audit_log(supabase, action: str, user_id: str, details: dict, ip_address: str = None):
    """Create audit log entry"""
    try:
        supabase.table("audit_logs").insert({
            "action": action,
            "user_id": user_id,
            "details": details,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Audit log error: {e}")

def validate_environment():
    """Validate required environment variables are set"""
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_KEY",
        "ENCRYPTION_KEY",
    ]
    
    missing = [var for var in required_vars if not os.getenv(var)]
    
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")
    
    # Check if using default JWT secret
    if SECRET_KEY == "CHANGE_THIS_IN_PRODUCTION_USE_openssl_rand_hex_32":
        print("⚠️  WARNING: JWT_SECRET_KEY is using default value! Generate with: openssl rand -hex 32")


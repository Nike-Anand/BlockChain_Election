"""
Pydantic models for input validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
import re

class VoterRegistration(BaseModel):
    username: str
    password: str
    voterId: str  # Changed from voter_id to match frontend
    role: Optional[str] = "voter"
    photoBase64: Optional[str] = None  # Changed from photo_base64 to match frontend
    
    @validator('voterId')  # Changed to match field name
    def validate_voter_id(cls, v):
        # Relaxed validation - allow alphanumeric
        if not re.match(r'^[A-Za-z0-9]+$', v):
            raise ValueError('Voter ID must contain only letters and numbers')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        # Relaxed validation for compatibility
        if len(v) < 1:
            raise ValueError('Password cannot be empty')
        return v

# Alias for backward compatibility
UserRegister = VoterRegistration

class LoginRequest(BaseModel):
    voter_id: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=1, max_length=100)

class VoteCast(BaseModel):
    userId: str = Field(..., min_length=5, max_length=20)
    partyName: str = Field(..., min_length=1, max_length=100)
    boothId: str = Field(default="BOOTH_001", max_length=50)

class PartyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    symbol: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    manifesto: Optional[str] = None
    imageUrl: Optional[str] = None
    votes: int = Field(default=0)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Party name cannot be empty')
        return v.strip()

# Alias for backward compatibility
PartyAdd = PartyCreate

class SettingsUpdate(BaseModel):
    isActive: Optional[bool] = None
    registrationOpen: Optional[bool] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    pass1: Optional[str] = None
    pass2: Optional[str] = None
    pass3: Optional[str] = None
    pass4: Optional[str] = None

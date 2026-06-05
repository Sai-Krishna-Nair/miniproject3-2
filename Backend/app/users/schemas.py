from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProfileResponse(BaseModel):
    """Full user profile returned by GET endpoints."""
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ProfileUpdate(BaseModel):
    """Fields a user is allowed to update on their own profile."""
    full_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)

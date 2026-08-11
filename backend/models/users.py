from pydantic import BaseModel, EmailStr, Field
from typing import Optional


# Public identity — safe to return on posts, comments, and GET /users/{user_id}.
class UserResponse(BaseModel):
    user_id: str
    display_name: str


# Full private profile for the logged-in user (GET /users/me).
class ProfileResponse(BaseModel):
    user_id: str
    display_name: str
    email: EmailStr
    parent_type: Optional[str] = None
    parent_stage: Optional[str] = None


# V1 profile edits — extend this model as profile settings grow.
class ProfileUpdateRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=50)

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class SignUpRequest(BaseModel):
    display_name: str
    email: EmailStr
    password: str
    parent_type: Optional[str] = None
    birth_date: Optional[date] = None
    due_date: Optional[date] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
    access_token: Optional[str] = None


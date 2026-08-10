from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class Community(BaseModel):
    community_id: str
    name: Optional[str] = None
    description: Optional[str] = None
    members_count: Optional[int] = None
    category: Optional[str] = None
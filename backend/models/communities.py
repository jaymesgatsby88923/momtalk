from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date

class Community(BaseModel):
    community_id: str
    name: str
    description: str
    members_count: int
    category: str
    
from typing import Literal, Optional

from pydantic import BaseModel, Field


Visibility = Literal["private", "anonymous"]


class JournalCreateRequest(BaseModel):
    feeling: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    visibility: Visibility


class JournalUpdateRequest(BaseModel):
    feeling: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    visibility: Optional[Visibility] = None


class JournalEntryResponse(BaseModel):
    journal_entry_id: str
    feeling: str
    description: Optional[str] = None
    visibility: Visibility
    created_at: str
    updated_at: str

from typing import Optional

from pydantic import BaseModel


class AffirmationResponse(BaseModel):
    affirmation_id: str
    message: str
    subtext: Optional[str] = None


class SaveAffirmationRequest(BaseModel):
    affirmation_id: str

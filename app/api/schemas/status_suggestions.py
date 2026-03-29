from typing import Literal, Optional
from pydantic import BaseModel

SuggestionStatus = Literal["PENDING", "CONFIRMED", "DISMISSED"]


class SuggestionActionResponse(BaseModel):
    suggestion_id: int
    previous_status: SuggestionStatus
    new_status: SuggestionStatus
    applied_stage: Optional[str] = None


class SignalSuggestionRequest(BaseModel):
    application_id: int
    source_type: str
    raw_text: str

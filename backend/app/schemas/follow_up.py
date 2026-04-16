from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class FollowUpCreate(BaseModel):
    opportunity_id: int
    type: str
    content: str
    next_plan: Optional[str] = None


class FollowUpResponse(BaseModel):
    id: int
    opportunity_id: int
    type: str
    content: str
    next_plan: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

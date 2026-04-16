from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel


class OpportunityCreate(BaseModel):
    customer_id: int
    title: str
    stage: str = "初步接触"
    amount: float = 0
    expected_close_date: Optional[date] = None
    priority: str = "中"
    remark: Optional[str] = None


class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    stage: Optional[str] = None
    amount: Optional[float] = None
    expected_close_date: Optional[date] = None
    priority: Optional[str] = None
    remark: Optional[str] = None


class OpportunityResponse(BaseModel):
    id: int
    customer_id: int
    title: str
    stage: str
    amount: float
    expected_close_date: Optional[date]
    priority: str
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OpportunityListResponse(BaseModel):
    items: List[OpportunityResponse]
    total: int
    page: int
    page_size: int

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CustomerCreate(BaseModel):
    name: str
    industry: str
    scale: str
    source: str
    status: str = "潜在"
    region: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    scale: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    region: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    industry: str
    scale: str
    source: str
    status: str
    region: Optional[str]
    address: Optional[str]
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int

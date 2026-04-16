from typing import Optional
from pydantic import BaseModel


class ContactCreate(BaseModel):
    customer_id: int
    name: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_primary: bool = False


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_primary: Optional[bool] = None


class ContactResponse(BaseModel):
    id: int
    customer_id: int
    name: str
    position: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    is_primary: bool

    model_config = {"from_attributes": True}

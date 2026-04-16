from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
)
from app.schemas.contact import ContactResponse
from app.schemas.opportunity import OpportunityResponse

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    keyword: str = "",
    industry: str = "",
    status: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Customer)
    if keyword:
        query = query.filter(Customer.name.contains(keyword))
    if industry:
        query = query.filter(Customer.industry == industry)
    if status:
        query = query.filter(Customer.status == status)
    total = query.count()
    items = (
        query.order_by(Customer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=CustomerResponse)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db)):
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}")
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = (
        db.query(Customer)
        .options(joinedload(Customer.contacts), joinedload(Customer.opportunities))
        .filter(Customer.id == customer_id)
        .first()
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        **CustomerResponse.model_validate(customer).model_dump(),
        "contacts": [
            ContactResponse.model_validate(c).model_dump() for c in customer.contacts
        ],
        "opportunities": [
            OpportunityResponse.model_validate(o).model_dump()
            for o in customer.opportunities
        ],
    }


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"detail": "Deleted"}

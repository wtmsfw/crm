from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse

router = APIRouter(prefix="/api", tags=["contacts"])


@router.get("/customers/{customer_id}/contacts", response_model=List[ContactResponse])
def list_contacts(customer_id: int, db: Session = Depends(get_db)):
    return db.query(Contact).filter(Contact.customer_id == customer_id).all()


@router.post("/contacts", response_model=ContactResponse)
def create_contact(data: ContactCreate, db: Session = Depends(get_db)):
    contact = Contact(**data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/contacts/{contact_id}", response_model=ContactResponse)
def update_contact(contact_id: int, data: ContactUpdate, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, key, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"detail": "Deleted"}

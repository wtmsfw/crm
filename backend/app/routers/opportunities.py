from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.opportunity import Opportunity
from app.models.customer import Customer
from app.schemas.opportunity import (
    OpportunityCreate, OpportunityUpdate, OpportunityResponse, OpportunityListResponse,
)
from app.schemas.follow_up import FollowUpResponse

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])


@router.get("", response_model=OpportunityListResponse)
def list_opportunities(
    keyword: str = "",
    stage: str = "",
    priority: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Opportunity).join(Customer)
    if keyword:
        query = query.filter(Opportunity.title.contains(keyword))
    if stage:
        query = query.filter(Opportunity.stage == stage)
    if priority:
        query = query.filter(Opportunity.priority == priority)
    total = query.count()
    items = (
        query.order_by(Opportunity.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    result = []
    for opp in items:
        data = OpportunityResponse.model_validate(opp).model_dump()
        data["customer_name"] = opp.customer.name
        result.append(data)
    return {"items": result, "total": total, "page": page, "page_size": page_size}


@router.post("", response_model=OpportunityResponse)
def create_opportunity(data: OpportunityCreate, db: Session = Depends(get_db)):
    opp = Opportunity(**data.model_dump())
    db.add(opp)
    db.commit()
    db.refresh(opp)
    return opp


@router.get("/{opp_id}")
def get_opportunity(opp_id: int, db: Session = Depends(get_db)):
    opp = (
        db.query(Opportunity)
        .options(joinedload(Opportunity.follow_ups), joinedload(Opportunity.customer))
        .filter(Opportunity.id == opp_id)
        .first()
    )
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    data = OpportunityResponse.model_validate(opp).model_dump()
    data["customer_name"] = opp.customer.name
    data["follow_ups"] = [
        FollowUpResponse.model_validate(f).model_dump() for f in opp.follow_ups
    ]
    return data


@router.put("/{opp_id}", response_model=OpportunityResponse)
def update_opportunity(opp_id: int, data: OpportunityUpdate, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(opp, key, value)
    db.commit()
    db.refresh(opp)
    return opp


@router.delete("/{opp_id}")
def delete_opportunity(opp_id: int, db: Session = Depends(get_db)):
    opp = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    db.delete(opp)
    db.commit()
    return {"detail": "Deleted"}

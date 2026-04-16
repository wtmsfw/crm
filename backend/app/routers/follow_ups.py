from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.follow_up import FollowUp
from app.schemas.follow_up import FollowUpCreate, FollowUpResponse

router = APIRouter(prefix="/api", tags=["follow_ups"])


@router.get("/opportunities/{opp_id}/followups", response_model=List[FollowUpResponse])
def list_follow_ups(opp_id: int, db: Session = Depends(get_db)):
    return (
        db.query(FollowUp)
        .filter(FollowUp.opportunity_id == opp_id)
        .order_by(FollowUp.created_at.desc())
        .all()
    )


@router.post("/followups", response_model=FollowUpResponse)
def create_follow_up(data: FollowUpCreate, db: Session = Depends(get_db)):
    follow_up = FollowUp(**data.model_dump())
    db.add(follow_up)
    db.commit()
    db.refresh(follow_up)
    return follow_up

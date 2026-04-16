from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.customer import Customer
from app.models.opportunity import Opportunity

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    total_customers = db.query(func.count(Customer.id)).scalar()
    active_opportunities = (
        db.query(func.count(Opportunity.id))
        .filter(Opportunity.stage.notin_(["赢单", "输单"]))
        .scalar()
    )
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    new_customers_this_month = (
        db.query(func.count(Customer.id))
        .filter(Customer.created_at >= month_start)
        .scalar()
    )
    total_amount = (
        db.query(func.coalesce(func.sum(Opportunity.amount), 0)).scalar()
    )
    return {
        "total_customers": total_customers,
        "active_opportunities": active_opportunities,
        "new_customers_this_month": new_customers_this_month,
        "total_amount": total_amount,
    }


@router.get("/customer-industry")
def customer_industry(db: Session = Depends(get_db)):
    rows = (
        db.query(Customer.industry, func.count(Customer.id).label("count"))
        .group_by(Customer.industry)
        .all()
    )
    return [{"industry": r.industry, "count": r.count} for r in rows]


@router.get("/sales-funnel")
def sales_funnel(db: Session = Depends(get_db)):
    stages = ["初步接触", "需求确认", "方案报价", "商务谈判", "赢单", "输单"]
    rows = (
        db.query(
            Opportunity.stage,
            func.count(Opportunity.id).label("count"),
            func.coalesce(func.sum(Opportunity.amount), 0).label("amount"),
        )
        .group_by(Opportunity.stage)
        .all()
    )
    stage_map = {r.stage: {"count": r.count, "amount": r.amount} for r in rows}
    return [
        {
            "stage": s,
            "count": stage_map.get(s, {}).get("count", 0),
            "amount": stage_map.get(s, {}).get("amount", 0),
        }
        for s in stages
    ]


@router.get("/amount-trend")
def amount_trend(db: Session = Depends(get_db)):
    six_months_ago = datetime.now() - timedelta(days=180)
    rows = (
        db.query(
            func.strftime("%Y-%m", Opportunity.created_at).label("month"),
            func.coalesce(func.sum(Opportunity.amount), 0).label("amount"),
        )
        .filter(Opportunity.created_at >= six_months_ago)
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": r.month, "amount": r.amount} for r in rows]


@router.get("/customer-growth")
def customer_growth(db: Session = Depends(get_db)):
    six_months_ago = datetime.now() - timedelta(days=180)
    rows = (
        db.query(
            func.strftime("%Y-%m", Customer.created_at).label("month"),
            func.count(Customer.id).label("count"),
        )
        .filter(Customer.created_at >= six_months_ago)
        .group_by("month")
        .order_by("month")
        .all()
    )
    return [{"month": r.month, "count": r.count} for r in rows]

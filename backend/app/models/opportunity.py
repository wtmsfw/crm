from datetime import datetime, date
from typing import Optional
from sqlalchemy import String, Float, Text, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    stage: Mapped[str] = mapped_column(String(20), nullable=False, default="初步接触")
    amount: Mapped[float] = mapped_column(Float, default=0)
    expected_close_date: Mapped[Optional[date]] = mapped_column(Date)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="中")
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    customer = relationship("Customer", back_populates="opportunities")
    follow_ups = relationship(
        "FollowUp", back_populates="opportunity", cascade="all, delete-orphan"
    )

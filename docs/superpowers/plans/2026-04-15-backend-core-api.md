# CRM 后端核心接口 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 crm-demo 构建完整的 FastAPI 后端，覆盖客户管理、联系人管理、销售机会、跟进记录和数据分析 5 个模块的全部核心接口。

**Architecture:** 单体 FastAPI 应用，SQLAlchemy 2.0 ORM 对接 SQLite，Pydantic v2 负责请求/响应校验。路由按实体分模块挂载，全部接口统一前缀 `/api`。应用启动时自动建表并填充种子演示数据。

**Tech Stack:** FastAPI 0.115, SQLAlchemy 2.0, Pydantic v2, SQLite (crm.db), Uvicorn 0.30

---

## File Map

### 新建文件

```
backend/
├── requirements.txt
└── app/
    ├── __init__.py
    ├── database.py          # engine, Base, SessionLocal, get_db
    ├── main.py              # FastAPI app, CORS, 路由挂载, create_all, seed
    ├── seed.py              # 20 customers + 30 opportunities 演示数据
    ├── models/
    │   ├── __init__.py      # 导入所有 model（建表前必须）
    │   ├── customer.py
    │   ├── contact.py
    │   ├── opportunity.py
    │   └── follow_up.py
    ├── schemas/
    │   ├── customer.py
    │   ├── contact.py
    │   ├── opportunity.py
    │   └── follow_up.py
    └── routers/
        ├── customers.py     # GET/POST/GET:id/PUT:id/DELETE:id
        ├── contacts.py      # GET(by customer)/POST/PUT:id/DELETE:id
        ├── opportunities.py # GET/POST/GET:id/PUT:id/DELETE:id
        ├── follow_ups.py    # GET(by opp)/POST
        └── analytics.py     # overview/customer-industry/sales-funnel/amount-trend/customer-growth
```

---

## Task 1: 项目骨架 — requirements.txt + database.py

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 创建 requirements.txt**

```
backend/requirements.txt
```
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
pydantic==2.9.0
```

- [ ] **Step 2: 创建空 `__init__.py`**

```
backend/app/__init__.py  → 空文件
```

- [ ] **Step 3: 创建 database.py**

```python
# backend/app/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./crm.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Commit**

```bash
cd backend
git add requirements.txt app/__init__.py app/database.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add backend project scaffold with database layer"
```

---

## Task 2: ORM 模型层

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/customer.py`
- Create: `backend/app/models/contact.py`
- Create: `backend/app/models/opportunity.py`
- Create: `backend/app/models/follow_up.py`

> **关键约束：** SQLite 不支持 SQL `now()`，因此 `created_at` / `updated_at` 必须使用 Python 侧 callable (`default=lambda: datetime.now(timezone.utc)`)，**不能使用** `server_default=func.now()`。

- [ ] **Step 1: customer.py**

```python
# backend/app/models/customer.py
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    industry: Mapped[str] = mapped_column(String(50), nullable=False)
    scale: Mapped[str] = mapped_column(String(20), nullable=False)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="潜在")
    region: Mapped[Optional[str]] = mapped_column(String(100))
    address: Mapped[Optional[str]] = mapped_column(String(200))
    remark: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    contacts = relationship(
        "Contact", back_populates="customer", cascade="all, delete-orphan"
    )
    opportunities = relationship(
        "Opportunity", back_populates="customer", cascade="all, delete-orphan"
    )
```

- [ ] **Step 2: contact.py**

```python
# backend/app/models/contact.py
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[Optional[str]] = mapped_column(String(50))
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    email: Mapped[Optional[str]] = mapped_column(String(100))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    customer = relationship("Customer", back_populates="contacts")
```

- [ ] **Step 3: opportunity.py**

```python
# backend/app/models/opportunity.py
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy import String, Float, Text, Date, DateTime, ForeignKey
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
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer = relationship("Customer", back_populates="opportunities")
    follow_ups = relationship(
        "FollowUp", back_populates="opportunity", cascade="all, delete-orphan"
    )
```

- [ ] **Step 4: follow_up.py**

```python
# backend/app/models/follow_up.py
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    opportunity_id: Mapped[int] = mapped_column(
        ForeignKey("opportunities.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    next_plan: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    opportunity = relationship("Opportunity", back_populates="follow_ups")
```

- [ ] **Step 5: models/__init__.py（必须导入所有 model，否则 create_all 时表不会注册）**

```python
# backend/app/models/__init__.py
from app.models.customer import Customer  # noqa: F401
from app.models.contact import Contact  # noqa: F401
from app.models.opportunity import Opportunity  # noqa: F401
from app.models.follow_up import FollowUp  # noqa: F401

__all__ = ["Customer", "Contact", "Opportunity", "FollowUp"]
```

- [ ] **Step 6: Commit**

```bash
git add app/models/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add SQLAlchemy ORM models for all 4 entities"
```

---

## Task 3: Pydantic Schema 层

**Files:**
- Create: `backend/app/schemas/customer.py`
- Create: `backend/app/schemas/contact.py`
- Create: `backend/app/schemas/opportunity.py`
- Create: `backend/app/schemas/follow_up.py`

- [ ] **Step 1: schemas/customer.py**

```python
# backend/app/schemas/customer.py
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
    region: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: List[CustomerResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 2: schemas/contact.py**

```python
# backend/app/schemas/contact.py
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
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_primary: bool

    model_config = {"from_attributes": True}
```

- [ ] **Step 3: schemas/opportunity.py**

```python
# backend/app/schemas/opportunity.py
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
    expected_close_date: Optional[date] = None
    priority: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer_name: Optional[str] = None

    model_config = {"from_attributes": True}


class OpportunityListResponse(BaseModel):
    items: List[OpportunityResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 4: schemas/follow_up.py**

```python
# backend/app/schemas/follow_up.py
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
    next_plan: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Commit**

```bash
git add app/schemas/
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add Pydantic v2 schemas for all entities"
```

---

## Task 4: 客户路由 (`/api/customers`)

**Files:**
- Create: `backend/app/routers/customers.py`

接口：`GET /api/customers`（列表+分页+筛选）、`POST /api/customers`、`GET /api/customers/{id}`（含联系人+机会）、`PUT /api/customers/{id}`、`DELETE /api/customers/{id}`（级联删除）

- [ ] **Step 1: 创建 routers/customers.py**

```python
# backend/app/routers/customers.py
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
def update_customer(
    customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db)
):
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/customers.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add customer router with CRUD, pagination, and filtering"
```

---

## Task 5: 联系人路由 (`/api/contacts`)

**Files:**
- Create: `backend/app/routers/contacts.py`

接口：`GET /api/customers/{customer_id}/contacts`、`POST /api/contacts`、`PUT /api/contacts/{id}`、`DELETE /api/contacts/{id}`

- [ ] **Step 1: 创建 routers/contacts.py**

```python
# backend/app/routers/contacts.py
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
def update_contact(
    contact_id: int, data: ContactUpdate, db: Session = Depends(get_db)
):
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/contacts.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add contact router with CRUD"
```

---

## Task 6: 销售机会路由 (`/api/opportunities`)

**Files:**
- Create: `backend/app/routers/opportunities.py`

接口：`GET /api/opportunities`（列表+分页+筛选，含 customer_name）、`POST /api/opportunities`、`GET /api/opportunities/{id}`（含 follow_ups + customer_name）、`PUT /api/opportunities/{id}`、`DELETE /api/opportunities/{id}`

- [ ] **Step 1: 创建 routers/opportunities.py**

```python
# backend/app/routers/opportunities.py
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
def update_opportunity(
    opp_id: int, data: OpportunityUpdate, db: Session = Depends(get_db)
):
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/opportunities.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add opportunity router with CRUD, pagination, and filtering"
```

---

## Task 7: 跟进记录路由 (`/api/followups`)

**Files:**
- Create: `backend/app/routers/follow_ups.py`

接口：`GET /api/opportunities/{opp_id}/followups`（按机会查跟进，时间倒序）、`POST /api/followups`

- [ ] **Step 1: 创建 routers/follow_ups.py**

```python
# backend/app/routers/follow_ups.py
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/follow_ups.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add follow_up router"
```

---

## Task 8: 数据分析路由 (`/api/analytics`)

**Files:**
- Create: `backend/app/routers/analytics.py`

接口：`/overview`、`/customer-industry`、`/sales-funnel`（固定 6 阶段，无数据补 0）、`/amount-trend`（近 6 月）、`/customer-growth`（近 6 月）

- [ ] **Step 1: 创建 routers/analytics.py**

```python
# backend/app/routers/analytics.py
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
    total_amount = db.query(func.coalesce(func.sum(Opportunity.amount), 0)).scalar()
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
```

- [ ] **Step 2: Commit**

```bash
git add app/routers/analytics.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add analytics router with 5 dashboard endpoints"
```

---

## Task 9: 应用入口 main.py + 种子数据 seed.py

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/seed.py`

- [ ] **Step 1: 创建 seed.py（20 个客户 + 30 个机会 + 联系人 + 跟进记录）**

```python
# backend/app/seed.py
import random
from datetime import datetime, timedelta, date, timezone
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.contact import Contact
from app.models.opportunity import Opportunity
from app.models.follow_up import FollowUp

INDUSTRIES = ["互联网", "金融", "制造", "教育", "医疗", "其他"]
SCALES = ["小型", "中型", "大型", "集团"]
SOURCES = ["官网", "转介绍", "广告", "展会", "电话", "其他"]
STATUSES = ["潜在", "活跃", "成交", "流失"]
STAGES = ["初步接触", "需求确认", "方案报价", "商务谈判", "赢单", "输单"]
PRIORITIES = ["高", "中", "低"]
FOLLOW_TYPES = ["电话", "邮件", "拜访", "会议"]

COMPANY_NAMES = [
    "星辰科技", "云帆网络", "智联数据", "鼎新金融", "华创制造",
    "博学教育", "康瑞医疗", "天宇信息", "锐思咨询", "盛达贸易",
    "蓝海科技", "汇通金服", "精工制造", "启明教育", "仁和医药",
    "飞跃互联", "中信投资", "宏图工业", "新知学堂", "安康生物",
]

CONTACT_NAMES = [
    "张伟", "李娜", "王强", "刘洋", "陈静",
    "杨帆", "赵磊", "黄丽", "周杰", "吴敏",
    "徐涛", "孙燕", "马超", "朱红", "胡明",
]

POSITIONS = ["CEO", "CTO", "VP销售", "采购经理", "技术总监", "项目经理"]


def _rand_dt(months_back: int) -> datetime:
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=30 * months_back)
    return start + timedelta(days=random.randint(0, 30 * months_back))


def seed_data(db: Session) -> None:
    if db.query(Customer).count() > 0:
        return

    customers = []
    for i, name in enumerate(COMPANY_NAMES):
        created = _rand_dt(6)
        c = Customer(
            name=name,
            industry=INDUSTRIES[i % len(INDUSTRIES)],
            scale=random.choice(SCALES),
            source=random.choice(SOURCES),
            status=random.choice(STATUSES),
            region=random.choice(["北京", "上海", "广州", "深圳", "杭州", "成都"]),
            remark=f"{name}的备注信息",
            created_at=created,
            updated_at=created,
        )
        db.add(c)
        customers.append(c)

    db.flush()

    for c in customers:
        for j in range(random.randint(1, 3)):
            db.add(Contact(
                customer_id=c.id,
                name=random.choice(CONTACT_NAMES),
                position=random.choice(POSITIONS),
                phone=f"138{random.randint(10000000, 99999999)}",
                email=f"contact{random.randint(1, 999)}@example.com",
                is_primary=(j == 0),
            ))

    db.flush()

    opportunities = []
    for i in range(30):
        c = random.choice(customers)
        created = _rand_dt(6)
        opp = Opportunity(
            customer_id=c.id,
            title=f"{c.name} - 项目{chr(65 + i % 26)}",
            stage=random.choice(STAGES),
            amount=random.choice([1, 5, 10, 20, 50, 100, 200, 500]) * 10000,
            expected_close_date=date.today() + timedelta(days=random.randint(7, 180)),
            priority=random.choice(PRIORITIES),
            remark=f"销售机会备注{i + 1}",
            created_at=created,
            updated_at=created,
        )
        db.add(opp)
        opportunities.append(opp)

    db.flush()

    for opp in opportunities:
        num = random.randint(1, 5)
        for k in range(num):
            db.add(FollowUp(
                opportunity_id=opp.id,
                type=random.choice(FOLLOW_TYPES),
                content=f"第{k + 1}次跟进：与客户沟通了项目进展和需求细节。",
                next_plan="继续跟进，安排下次会议" if k < num - 1 else None,
                created_at=opp.created_at + timedelta(days=k * 7),
            ))

    db.commit()
```

- [ ] **Step 2: 创建 main.py**

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import *  # noqa: F401 — must import all models before create_all
from app.routers import customers, contacts, opportunities, follow_ups, analytics
from app.seed import seed_data

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_data(db)

app = FastAPI(title="CRM API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router)
app.include_router(contacts.router)
app.include_router(opportunities.router)
app.include_router(follow_ups.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 3: 创建 routers/__init__.py（空文件，让 Python 识别为 package）**

```
backend/app/routers/__init__.py  → 空文件
```

- [ ] **Step 4: Commit**

```bash
git add app/main.py app/seed.py app/routers/__init__.py
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): add main app entrypoint and seed data"
```

---

## Task 10: 安装依赖并验证启动

**验证所有接口可正常访问。**

- [ ] **Step 1: 安装依赖**

```bash
cd D:/datum/GitRepositry/crm-demo/backend
pip install -r requirements.txt
```

Expected: 所有包安装成功，无 error。

- [ ] **Step 2: 启动服务器**

```bash
uvicorn app.main:app --reload --port 8000
```

Expected 输出中包含：
```
INFO:     Application startup complete.
```

- [ ] **Step 3: 验证健康检查**

```bash
curl http://localhost:8000/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: 验证客户列表（应返回 20 条种子数据）**

```bash
curl "http://localhost:8000/api/customers?page=1&page_size=5"
```

Expected: `{"items":[...],"total":20,"page":1,"page_size":5}`

- [ ] **Step 5: 验证机会列表（应返回 30 条）**

```bash
curl "http://localhost:8000/api/opportunities?page=1&page_size=5"
```

Expected: `{"items":[...],"total":30,"page":1,"page_size":5}`，每条 item 含 `customer_name` 字段。

- [ ] **Step 6: 验证详情 + 级联数据**

```bash
curl http://localhost:8000/api/customers/1
```

Expected: 返回 customer 对象，含非空 `contacts` 数组和 `opportunities` 数组。

- [ ] **Step 7: 验证分析接口**

```bash
curl http://localhost:8000/api/analytics/overview
curl http://localhost:8000/api/analytics/sales-funnel
```

Expected overview: `total_customers=20, active_opportunities>0`
Expected sales-funnel: 数组长度恰好为 6（6 个阶段，无数据的阶段 count=0）

- [ ] **Step 8: 验证 404**

```bash
curl http://localhost:8000/api/customers/9999
```

Expected: `{"detail":"Customer not found"}` HTTP 404

- [ ] **Step 9: 验证创建客户**

```bash
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"测试公司","industry":"互联网","scale":"小型","source":"官网"}'
```

Expected: 返回新建的 CustomerResponse，含 `id`、`created_at`、`updated_at`，`status` 默认 `"潜在"`。

- [ ] **Step 10: 查看 API 文档（交互式验证）**

浏览器打开 `http://localhost:8000/docs`，确认 OpenAPI 文档展示所有路由。

- [ ] **Step 11: Final commit**

```bash
git add .
git commit --author="AiCoding <ai_coding@bilibili.com>" -m "feat(crm-demo): complete backend core API implementation"
```

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import *  # noqa: F401
from app.routers import customers, contacts, opportunities, follow_ups, analytics
from app.seed import seed_data

Base.metadata.create_all(bind=engine)

# Seed data on startup
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

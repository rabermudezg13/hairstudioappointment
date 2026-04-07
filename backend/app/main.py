from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, SessionLocal, Base
from .models import Service, Appointment
from .routers import appointments, services, sms


DEFAULT_SERVICES = [
    {"name": "Corte", "duration_minutes": 45, "price": 25.00},
    {"name": "Color", "duration_minutes": 120, "price": 80.00},
    {"name": "Peinado", "duration_minutes": 60, "price": 40.00},
    {"name": "Maquillaje", "duration_minutes": 60, "price": 50.00},
]


def seed_services(db):
    existing = db.query(Service).count()
    if existing == 0:
        for svc in DEFAULT_SERVICES:
            db.add(Service(**svc))
        db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    # Seed default services
    db = SessionLocal()
    try:
        seed_services(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Ludy Hair Studio API",
    description="Appointment management system for Ludy Hair Studio",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(services.router)
app.include_router(appointments.router)
app.include_router(sms.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Ludy Hair Studio API"}


@app.get("/")
def root():
    return {"message": "Welcome to Ludy Hair Studio API", "docs": "/docs"}

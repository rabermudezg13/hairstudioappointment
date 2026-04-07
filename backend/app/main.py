import os
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
    import time
    # Retry DB connection up to 10 times (Railway DB may not be ready immediately)
    for attempt in range(10):
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                seed_services(db)
            finally:
                db.close()
            break
        except Exception as e:
            if attempt < 9:
                print(f"DB not ready (attempt {attempt + 1}/10): {e}. Retrying in 3s...")
                time.sleep(3)
            else:
                print(f"Could not connect to DB after 10 attempts: {e}")
                raise
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
    return {"status": "ok", "service": "Ludy Hair Studio API", "port": os.getenv("PORT", "unknown")}


@app.get("/")
def root():
    return {"message": "Welcome to Ludy Hair Studio API", "docs": "/docs"}

from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from .models import AppointmentStatus


# ── Service schemas ──────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    name: str
    duration_minutes: int = 60
    price: float = 0.0
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Appointment schemas ──────────────────────────────────────────────────────

class AppointmentBase(BaseModel):
    client_name: str
    client_phone: str
    service_id: int
    appointment_date: datetime
    notes: Optional[str] = None
    status: AppointmentStatus = AppointmentStatus.scheduled


class AppointmentCreate(AppointmentBase):
    pass


class AppointmentUpdate(BaseModel):
    client_name: Optional[str] = None
    client_phone: Optional[str] = None
    service_id: Optional[int] = None
    appointment_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[AppointmentStatus] = None
    sms_sent: Optional[bool] = None


class AppointmentResponse(AppointmentBase):
    id: int
    sms_sent: bool
    created_at: datetime
    service: Optional[ServiceResponse] = None

    model_config = {"from_attributes": True}


class AppointmentsByDate(BaseModel):
    date: str
    appointments: List[AppointmentResponse]


class BulkSMSResponse(BaseModel):
    sent: int
    failed: int
    details: List[dict]


class SMSSendResponse(BaseModel):
    success: bool
    message: str
    sid: Optional[str] = None

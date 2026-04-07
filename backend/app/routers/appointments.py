from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timezone, timedelta
from collections import defaultdict

from ..database import get_db
from ..models import Appointment, AppointmentStatus
from ..schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentsByDate

router = APIRouter(prefix="/api/appointments", tags=["appointments"])


def _get_appointment_or_404(appointment_id: int, db: Session) -> Appointment:
    appt = (
        db.query(Appointment)
        .options(joinedload(Appointment.service))
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.get("/by-date", response_model=List[AppointmentsByDate])
def appointments_by_date(
    upcoming: Optional[bool] = None,
    past: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    query = db.query(Appointment).options(joinedload(Appointment.service))

    if upcoming is True:
        query = query.filter(Appointment.appointment_date >= now)
    elif past is True:
        query = query.filter(Appointment.appointment_date < now)

    appointments = query.order_by(Appointment.appointment_date).all()

    grouped: dict = defaultdict(list)
    for appt in appointments:
        appt_date = appt.appointment_date
        if appt_date.tzinfo is None:
            appt_date = appt_date.replace(tzinfo=timezone.utc)
        day_key = appt_date.strftime("%Y-%m-%d")
        grouped[day_key].append(appt)

    result = []
    for day_key in sorted(grouped.keys()):
        result.append(AppointmentsByDate(date=day_key, appointments=grouped[day_key]))

    return result


@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    date_filter: Optional[str] = Query(None, alias="date"),
    status_filter: Optional[AppointmentStatus] = Query(None, alias="status"),
    upcoming: Optional[bool] = None,
    past: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    query = db.query(Appointment).options(joinedload(Appointment.service))

    if date_filter:
        try:
            target_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            start = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0, tzinfo=timezone.utc)
            end = start + timedelta(days=1)
            query = query.filter(Appointment.appointment_date >= start, Appointment.appointment_date < end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if status_filter:
        query = query.filter(Appointment.status == status_filter)

    if upcoming is True:
        query = query.filter(Appointment.appointment_date >= now)
    elif past is True:
        query = query.filter(Appointment.appointment_date < now)

    return query.order_by(Appointment.appointment_date).all()


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    appointment = Appointment(**payload.model_dump())
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return _get_appointment_or_404(appointment.id, db)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    return _get_appointment_or_404(appointment_id, db)


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, payload: AppointmentUpdate, db: Session = Depends(get_db)):
    appt = _get_appointment_or_404(appointment_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)
    db.commit()
    db.refresh(appt)
    return _get_appointment_or_404(appointment_id, db)


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appt = _get_appointment_or_404(appointment_id, db)
    db.delete(appt)
    db.commit()

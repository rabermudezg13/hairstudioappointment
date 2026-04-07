from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, timedelta

from ..database import get_db
from ..models import Appointment, AppointmentStatus
from ..schemas import SMSSendResponse, BulkSMSResponse
from ..utils.twilio_helper import send_sms, build_reminder_message

router = APIRouter(prefix="/api/sms", tags=["sms"])


@router.post("/send-reminder/{appointment_id}", response_model=SMSSendResponse)
def send_reminder(appointment_id: int, db: Session = Depends(get_db)):
    appt = (
        db.query(Appointment)
        .options(joinedload(Appointment.service))
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt_date = appt.appointment_date
    if appt_date.tzinfo is None:
        appt_date = appt_date.replace(tzinfo=timezone.utc)

    message = build_reminder_message(
        client_name=appt.client_name,
        appointment_date=appt_date.strftime("%d/%m/%Y"),
        appointment_time=appt_date.strftime("%H:%M"),
        service_name=appt.service.name if appt.service else "servicio",
    )

    result = send_sms(to_phone=appt.client_phone, message=message)

    if result["success"]:
        appt.sms_sent = True
        db.commit()

    return SMSSendResponse(
        success=result["success"],
        message=result["message"],
        sid=result.get("sid"),
    )


@router.post("/send-bulk-reminders", response_model=BulkSMSResponse)
def send_bulk_reminders(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    tomorrow_start = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_end = tomorrow_start + timedelta(days=1)

    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.service))
        .filter(
            Appointment.appointment_date >= tomorrow_start,
            Appointment.appointment_date < tomorrow_end,
            Appointment.status == AppointmentStatus.scheduled,
        )
        .all()
    )

    sent = 0
    failed = 0
    details = []

    for appt in appointments:
        appt_date = appt.appointment_date
        if appt_date.tzinfo is None:
            appt_date = appt_date.replace(tzinfo=timezone.utc)

        message = build_reminder_message(
            client_name=appt.client_name,
            appointment_date=appt_date.strftime("%d/%m/%Y"),
            appointment_time=appt_date.strftime("%H:%M"),
            service_name=appt.service.name if appt.service else "servicio",
        )

        result = send_sms(to_phone=appt.client_phone, message=message)

        if result["success"]:
            appt.sms_sent = True
            sent += 1
        else:
            failed += 1

        details.append(
            {
                "appointment_id": appt.id,
                "client_name": appt.client_name,
                "phone": appt.client_phone,
                "success": result["success"],
                "message": result["message"],
                "sid": result.get("sid"),
            }
        )

    db.commit()

    return BulkSMSResponse(sent=sent, failed=failed, details=details)

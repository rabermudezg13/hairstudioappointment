import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")


def send_sms(to_phone: str, message: str) -> dict:
    """
    Send an SMS via Twilio.
    Returns a dict with success, message, and optionally sid.
    """
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        return {
            "success": False,
            "message": "Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
            "sid": None,
        }

    try:
        from twilio.rest import Client
        from twilio.base.exceptions import TwilioRestException

        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Normalize phone number – add + if missing
        normalized = to_phone.strip()
        if not normalized.startswith("+"):
            normalized = "+" + normalized

        msg = client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=normalized,
        )
        return {"success": True, "message": "SMS sent successfully.", "sid": msg.sid}

    except Exception as exc:
        return {"success": False, "message": str(exc), "sid": None}


def build_reminder_message(client_name: str, appointment_date: str, appointment_time: str, service_name: str) -> str:
    return (
        f"Hola {client_name}! Te recordamos tu cita en Ludy Hair Studio "
        f"mañana {appointment_date} a las {appointment_time} para {service_name}. "
        f"¡Te esperamos! 💇‍♀️"
    )

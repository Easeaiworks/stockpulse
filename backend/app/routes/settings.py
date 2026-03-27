"""Settings and scheduler management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.notification_settings import NotificationSettings
from app.services.scheduler import (
    get_scheduler_jobs,
    update_fetch_interval,
    fetch_all_quotes,
)
from app.services.alert_engine import generate_trend_summary

router = APIRouter(prefix="/api/settings", tags=["settings"])


class NotificationSettingsRequest(BaseModel):
    email_enabled: Optional[bool] = None
    email_address: Optional[str] = None
    sms_enabled: Optional[bool] = None
    sms_gateway_email: Optional[str] = None
    daily_digest: Optional[bool] = None
    weekly_digest: Optional[bool] = None
    digest_time: Optional[str] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None


class FetchIntervalRequest(BaseModel):
    minutes: int


@router.get("/notifications")
def get_settings(db: Session = Depends(get_db)):
    """Get notification settings."""
    ns = db.query(NotificationSettings).first()
    if not ns:
        ns = NotificationSettings()
        db.add(ns)
        db.commit()
        db.refresh(ns)
    return {"settings": ns.to_dict()}


@router.put("/notifications")
def update_settings(req: NotificationSettingsRequest, db: Session = Depends(get_db)):
    """Update notification settings."""
    ns = db.query(NotificationSettings).first()
    if not ns:
        ns = NotificationSettings()
        db.add(ns)
        db.commit()
        db.refresh(ns)

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(ns, field, value)

    db.commit()
    db.refresh(ns)
    return {"settings": ns.to_dict(), "message": "Settings updated"}


@router.get("/scheduler")
def get_schedule():
    """Get info about scheduled jobs."""
    return {"jobs": get_scheduler_jobs()}


@router.post("/scheduler/interval")
def set_fetch_interval(req: FetchIntervalRequest):
    """Update the fetch interval (in minutes)."""
    if req.minutes < 5:
        raise HTTPException(status_code=400, detail="Minimum interval is 5 minutes")
    if req.minutes > 10080:  # 1 week
        raise HTTPException(status_code=400, detail="Maximum interval is 10080 minutes (1 week)")

    update_fetch_interval(req.minutes)
    return {"message": f"Fetch interval set to {req.minutes} minutes"}


@router.post("/scheduler/fetch-now")
def trigger_fetch_now():
    """Manually trigger an immediate data fetch for all watchlist items."""
    import threading
    thread = threading.Thread(target=fetch_all_quotes)
    thread.start()
    return {"message": "Fetch triggered — data will be updated shortly"}


@router.get("/report")
def get_report(db: Session = Depends(get_db)):
    """Get current portfolio trend summary report."""
    summary = generate_trend_summary(db)
    return {"report": summary}

"""Alert management API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.alert import Alert, AlertType
from app.models.watchlist import WatchlistItem

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class CreateAlertRequest(BaseModel):
    watchlist_item_id: int
    alert_type: str  # price_above, price_below, pct_change_up, pct_change_down, volume_spike
    threshold_value: float
    recurring: bool = False
    cooldown_minutes: int = 60
    note: Optional[str] = None


class UpdateAlertRequest(BaseModel):
    is_active: Optional[bool] = None
    threshold_value: Optional[float] = None
    recurring: Optional[bool] = None
    cooldown_minutes: Optional[int] = None
    note: Optional[str] = None


@router.get("")
def get_alerts(db: Session = Depends(get_db)):
    """Get all alerts with their watchlist item info."""
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).all()
    result = []
    for alert in alerts:
        item = db.query(WatchlistItem).filter(WatchlistItem.id == alert.watchlist_item_id).first()
        d = alert.to_dict()
        d["symbol"] = item.symbol if item else "Unknown"
        d["name"] = item.name if item else "Unknown"
        d["current_price"] = item.last_price if item else None
        result.append(d)
    return {"alerts": result}


@router.post("")
def create_alert(req: CreateAlertRequest, db: Session = Depends(get_db)):
    """Create a new price/volume alert."""
    # Validate watchlist item exists
    item = db.query(WatchlistItem).filter(WatchlistItem.id == req.watchlist_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    # Validate alert type
    try:
        alert_type = AlertType(req.alert_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid alert type. Must be one of: {[t.value for t in AlertType]}"
        )

    alert = Alert(
        watchlist_item_id=req.watchlist_item_id,
        alert_type=alert_type,
        threshold_value=req.threshold_value,
        recurring=req.recurring,
        cooldown_minutes=req.cooldown_minutes,
        note=req.note,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    d = alert.to_dict()
    d["symbol"] = item.symbol
    d["name"] = item.name
    return {"alert": d, "message": "Alert created"}


@router.patch("/{alert_id}")
def update_alert(alert_id: int, req: UpdateAlertRequest, db: Session = Depends(get_db)):
    """Update an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if req.is_active is not None:
        alert.is_active = req.is_active
        if req.is_active:
            alert.is_triggered = False  # Reset trigger state when reactivating
    if req.threshold_value is not None:
        alert.threshold_value = req.threshold_value
    if req.recurring is not None:
        alert.recurring = req.recurring
    if req.cooldown_minutes is not None:
        alert.cooldown_minutes = req.cooldown_minutes
    if req.note is not None:
        alert.note = req.note

    db.commit()
    db.refresh(alert)
    return {"alert": alert.to_dict()}


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete an alert."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted"}

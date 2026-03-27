import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AlertType(str, enum.Enum):
    PRICE_ABOVE = "price_above"
    PRICE_BELOW = "price_below"
    PCT_CHANGE_UP = "pct_change_up"
    PCT_CHANGE_DOWN = "pct_change_down"
    VOLUME_SPIKE = "volume_spike"


class Alert(Base):
    """A price/volume alert configured for a watchlist item."""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    watchlist_item_id = Column(Integer, ForeignKey("watchlist_items.id"), nullable=False)
    alert_type = Column(Enum(AlertType), nullable=False)
    threshold_value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    is_triggered = Column(Boolean, default=False)
    triggered_at = Column(DateTime, nullable=True)
    cooldown_minutes = Column(Integer, default=60)  # Don't re-fire within this window
    last_notified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # One-time vs recurring
    recurring = Column(Boolean, default=False)
    note = Column(String(500), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "watchlist_item_id": self.watchlist_item_id,
            "alert_type": self.alert_type.value,
            "threshold_value": self.threshold_value,
            "is_active": self.is_active,
            "is_triggered": self.is_triggered,
            "triggered_at": self.triggered_at.isoformat() if self.triggered_at else None,
            "cooldown_minutes": self.cooldown_minutes,
            "recurring": self.recurring,
            "note": self.note,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

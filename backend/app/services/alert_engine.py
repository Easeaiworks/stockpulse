"""Alert evaluation engine - checks watchlist data against configured alerts."""
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.alert import Alert, AlertType
from app.models.watchlist import WatchlistItem

logger = logging.getLogger(__name__)


def evaluate_alerts(db: Session) -> list[dict]:
    """
    Check all active alerts against current market data.
    Returns list of triggered alert details for notification.
    """
    triggered = []

    active_alerts = (
        db.query(Alert)
        .filter(Alert.is_active == True)
        .all()
    )

    for alert in active_alerts:
        item = db.query(WatchlistItem).filter(WatchlistItem.id == alert.watchlist_item_id).first()
        if not item or not item.is_active or item.last_price is None:
            continue

        # Check cooldown - don't re-fire too quickly
        if alert.last_notified_at:
            cooldown_end = alert.last_notified_at + timedelta(minutes=alert.cooldown_minutes)
            if datetime.utcnow() < cooldown_end:
                continue

        fired = False
        message = ""

        if alert.alert_type == AlertType.PRICE_ABOVE:
            if item.last_price >= alert.threshold_value:
                fired = True
                message = (
                    f"📈 {item.symbol} hit ${item.last_price:.2f} "
                    f"(above your target of ${alert.threshold_value:.2f})"
                )

        elif alert.alert_type == AlertType.PRICE_BELOW:
            if item.last_price <= alert.threshold_value:
                fired = True
                message = (
                    f"📉 {item.symbol} dropped to ${item.last_price:.2f} "
                    f"(below your target of ${alert.threshold_value:.2f})"
                )

        elif alert.alert_type == AlertType.PCT_CHANGE_UP:
            if item.last_change_pct is not None and item.last_change_pct >= alert.threshold_value:
                fired = True
                message = (
                    f"🚀 {item.symbol} is up {item.last_change_pct:.1f}% "
                    f"(above your {alert.threshold_value:.1f}% threshold)"
                )

        elif alert.alert_type == AlertType.PCT_CHANGE_DOWN:
            if item.last_change_pct is not None and item.last_change_pct <= -alert.threshold_value:
                fired = True
                message = (
                    f"🔻 {item.symbol} is down {abs(item.last_change_pct):.1f}% "
                    f"(exceeded your {alert.threshold_value:.1f}% threshold)"
                )

        elif alert.alert_type == AlertType.VOLUME_SPIKE:
            if item.last_volume and item.avg_volume and item.avg_volume > 0:
                volume_ratio = item.last_volume / item.avg_volume
                if volume_ratio >= alert.threshold_value:
                    fired = True
                    message = (
                        f"📊 {item.symbol} volume spike: {volume_ratio:.1f}x average "
                        f"({item.last_volume:,} vs avg {item.avg_volume:,})"
                    )

        if fired:
            now = datetime.utcnow()
            alert.is_triggered = True
            alert.triggered_at = now
            alert.last_notified_at = now

            # Deactivate one-time alerts
            if not alert.recurring:
                alert.is_active = False

            triggered.append({
                "alert_id": alert.id,
                "symbol": item.symbol,
                "name": item.name,
                "alert_type": alert.alert_type.value,
                "message": message,
                "price": item.last_price,
                "note": alert.note,
                "triggered_at": now.isoformat(),
            })

    if triggered:
        db.commit()
        logger.info(f"Triggered {len(triggered)} alerts")

    return triggered


def generate_trend_summary(db: Session) -> list[dict]:
    """Generate a summary of all tracked securities' performance."""
    items = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.is_active == True)
        .filter(WatchlistItem.last_price.isnot(None))
        .all()
    )

    summary = []
    for item in items:
        summary.append({
            "symbol": item.symbol,
            "name": item.name,
            "price": item.last_price,
            "change_pct": item.last_change_pct,
            "volume": item.last_volume,
            "avg_volume": item.avg_volume,
            "security_type": item.security_type,
            "currency": item.currency,
        })

    # Sort by absolute change percentage (most volatile first)
    summary.sort(key=lambda x: abs(x.get("change_pct") or 0), reverse=True)
    return summary

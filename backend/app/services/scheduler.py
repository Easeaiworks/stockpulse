"""Background scheduler for periodic data fetching and alert evaluation."""
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.watchlist import WatchlistItem
from app.models.price_history import PriceSnapshot
from app.services.market_data import fetch_quote
from app.services.alert_engine import evaluate_alerts, generate_trend_summary
from app.services.notifier import notify_triggered_alerts, send_digest_email

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def fetch_all_quotes():
    """Fetch latest quotes for all active watchlist items."""
    db: Session = SessionLocal()
    try:
        items = db.query(WatchlistItem).filter(WatchlistItem.is_active == True).all()
        if not items:
            logger.info("No active watchlist items to fetch")
            return

        logger.info(f"Fetching quotes for {len(items)} items...")

        for item in items:
            quote = fetch_quote(item.symbol)
            if quote and quote.get("price") is not None:
                item.last_price = quote["price"]
                item.last_change_pct = quote.get("change_pct")
                item.last_volume = quote.get("volume")
                item.avg_volume = quote.get("avg_volume")
                item.last_fetched_at = datetime.utcnow()

                # Save snapshot for history
                snapshot = PriceSnapshot(
                    watchlist_item_id=item.id,
                    symbol=item.symbol,
                    price=quote["price"],
                    open_price=quote.get("open_price"),
                    high_price=quote.get("high_price"),
                    low_price=quote.get("low_price"),
                    volume=quote.get("volume"),
                    change_pct=quote.get("change_pct"),
                    market_cap=quote.get("market_cap"),
                )
                db.add(snapshot)

        db.commit()
        logger.info("Quotes fetched and saved successfully")

        # Evaluate alerts after fetching
        triggered = evaluate_alerts(db)
        if triggered:
            notify_triggered_alerts(db, triggered)

    except Exception as e:
        logger.error(f"Error in fetch_all_quotes: {e}")
        db.rollback()
    finally:
        db.close()


def send_daily_digest():
    """Send daily trend summary email."""
    db: Session = SessionLocal()
    try:
        summary = generate_trend_summary(db)
        if summary:
            send_digest_email(db, summary, "daily")
    finally:
        db.close()


def send_weekly_digest():
    """Send weekly trend summary email."""
    db: Session = SessionLocal()
    try:
        summary = generate_trend_summary(db)
        if summary:
            send_digest_email(db, summary, "weekly")
    finally:
        db.close()


def start_scheduler():
    """Initialize and start the background scheduler."""
    # Fetch quotes every hour during market hours (rough global coverage)
    scheduler.add_job(
        fetch_all_quotes,
        trigger=IntervalTrigger(minutes=60),
        id="fetch_quotes_hourly",
        name="Fetch quotes hourly",
        replace_existing=True,
    )

    # Daily digest at 6 PM UTC (after US market close)
    scheduler.add_job(
        send_daily_digest,
        trigger=CronTrigger(hour=18, minute=0),
        id="daily_digest",
        name="Daily digest email",
        replace_existing=True,
    )

    # Weekly digest every Friday at 6:30 PM UTC
    scheduler.add_job(
        send_weekly_digest,
        trigger=CronTrigger(day_of_week="fri", hour=18, minute=30),
        id="weekly_digest",
        name="Weekly digest email",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started with hourly fetch, daily & weekly digests")


def stop_scheduler():
    """Shut down the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")


def update_fetch_interval(minutes: int):
    """Update the quote fetching interval dynamically."""
    scheduler.reschedule_job(
        "fetch_quotes_hourly",
        trigger=IntervalTrigger(minutes=minutes),
    )
    logger.info(f"Fetch interval updated to every {minutes} minutes")


def get_scheduler_jobs() -> list[dict]:
    """Return info about scheduled jobs."""
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
        })
    return jobs

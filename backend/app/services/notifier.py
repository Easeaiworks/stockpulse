"""Notification service for email and SMS alerts."""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification_settings import NotificationSettings

logger = logging.getLogger(__name__)


def get_notification_settings(db: Session) -> NotificationSettings | None:
    """Get the notification settings (single-user, so just grab the first row)."""
    return db.query(NotificationSettings).first()


def send_email(settings: NotificationSettings, subject: str, html_body: str, plain_body: str = "") -> bool:
    """Send an email notification using configured SMTP."""
    if not settings or not settings.email_enabled or not settings.email_address:
        logger.info("Email notifications not configured, skipping")
        return False

    if not settings.smtp_host or not settings.smtp_user:
        logger.warning("SMTP not configured")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_user
        msg["To"] = settings.email_address

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, settings.email_address, msg.as_string())

        logger.info(f"Email sent to {settings.email_address}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def send_sms(settings: NotificationSettings, message: str) -> bool:
    """Send SMS via email-to-SMS gateway."""
    if not settings or not settings.sms_enabled or not settings.sms_gateway_email:
        return False

    if not settings.smtp_host or not settings.smtp_user:
        logger.warning("SMTP not configured for SMS gateway")
        return False

    try:
        msg = MIMEText(message)
        msg["Subject"] = ""
        msg["From"] = settings.smtp_user
        msg["To"] = settings.sms_gateway_email

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, settings.sms_gateway_email, msg.as_string())

        logger.info(f"SMS sent via {settings.sms_gateway_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMS: {e}")
        return False


def notify_triggered_alerts(db: Session, alerts: list[dict]):
    """Send notifications for triggered alerts via email and/or SMS."""
    if not alerts:
        return

    ns = get_notification_settings(db)
    if not ns:
        return

    for alert_data in alerts:
        message = alert_data["message"]
        if alert_data.get("note"):
            message += f"\nNote: {alert_data['note']}"

        # Send SMS (short message)
        if ns.sms_enabled:
            send_sms(ns, message)

    # Send a combined email for all triggered alerts
    if ns.email_enabled and alerts:
        subject = f"🔔 StockPulse: {len(alerts)} Alert{'s' if len(alerts) > 1 else ''} Triggered"
        html_body = _build_alert_email(alerts)
        plain_body = "\n\n".join(a["message"] for a in alerts)
        send_email(ns, subject, html_body, plain_body)


def send_digest_email(db: Session, summary: list[dict], digest_type: str = "daily"):
    """Send a digest email with portfolio summary."""
    ns = get_notification_settings(db)
    if not ns or not ns.email_enabled:
        return

    subject = f"📊 StockPulse {digest_type.title()} Digest — {datetime.utcnow().strftime('%b %d, %Y')}"
    html_body = _build_digest_email(summary, digest_type)
    plain_body = _build_digest_plain(summary, digest_type)
    send_email(ns, subject, html_body, plain_body)


def _build_alert_email(alerts: list[dict]) -> str:
    """Build HTML email for triggered alerts."""
    rows = ""
    for a in alerts:
        rows += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">{a['symbol']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{a['name']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${a['price']:.2f}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{a['message']}</td>
        </tr>"""

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">🔔 Alert{'s' if len(alerts) > 1 else ''} Triggered</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Symbol</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Name</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Price</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Alert</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">— StockPulse</p>
    </div>"""


def _build_digest_email(summary: list[dict], digest_type: str) -> str:
    """Build HTML digest email."""
    rows = ""
    for s in summary:
        pct = s.get("change_pct") or 0
        color = "#16a34a" if pct >= 0 else "#dc2626"
        arrow = "▲" if pct >= 0 else "▼"
        rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">{s['symbol']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">{s['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${s['price']:.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: {color}; font-weight: 600;">
                {arrow} {abs(pct):.1f}%
            </td>
        </tr>"""

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">📊 {digest_type.title()} Portfolio Digest</h2>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f8fafc;">
                    <th style="padding: 10px; text-align: left;">Symbol</th>
                    <th style="padding: 10px; text-align: left;">Name</th>
                    <th style="padding: 10px; text-align: left;">Price</th>
                    <th style="padding: 10px; text-align: left;">Change</th>
                </tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
        <p style="color: #64748b; font-size: 13px; margin-top: 20px;">— StockPulse</p>
    </div>"""


def _build_digest_plain(summary: list[dict], digest_type: str) -> str:
    """Build plain text digest."""
    lines = [f"StockPulse {digest_type.title()} Digest\n"]
    for s in summary:
        pct = s.get("change_pct") or 0
        arrow = "▲" if pct >= 0 else "▼"
        lines.append(f"{s['symbol']}: ${s['price']:.2f} {arrow} {abs(pct):.1f}%")
    return "\n".join(lines)

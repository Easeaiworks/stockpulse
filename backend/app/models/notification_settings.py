from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class NotificationSettings(Base):
    """Global notification preferences."""

    __tablename__ = "notification_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email_enabled = Column(Boolean, default=False)
    email_address = Column(String(200), nullable=True)
    sms_enabled = Column(Boolean, default=False)
    sms_gateway_email = Column(String(200), nullable=True)

    # Digest schedule
    daily_digest = Column(Boolean, default=True)
    weekly_digest = Column(Boolean, default=True)
    digest_time = Column(String(5), default="08:00")  # HH:MM format

    # SMTP settings (stored per-user for flexibility)
    smtp_host = Column(String(200), nullable=True)
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(200), nullable=True)
    smtp_password = Column(String(200), nullable=True)

    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "email_enabled": self.email_enabled,
            "email_address": self.email_address,
            "sms_enabled": self.sms_enabled,
            "sms_gateway_email": self.sms_gateway_email,
            "daily_digest": self.daily_digest,
            "weekly_digest": self.weekly_digest,
            "digest_time": self.digest_time,
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_user": self.smtp_user,
            "smtp_password": "",  # Never expose password
        }

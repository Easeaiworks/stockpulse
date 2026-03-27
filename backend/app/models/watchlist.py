from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.database import Base


class WatchlistItem(Base):
    """A security (stock, ETF, fund, option) being tracked."""

    __tablename__ = "watchlist_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(30), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    security_type = Column(String(20), nullable=False)  # stock, etf, fund, option
    exchange = Column(String(50), nullable=True)
    currency = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Latest cached data
    last_price = Column(Float, nullable=True)
    last_change_pct = Column(Float, nullable=True)
    last_volume = Column(Integer, nullable=True)
    avg_volume = Column(Integer, nullable=True)
    last_fetched_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "name": self.name,
            "security_type": self.security_type,
            "exchange": self.exchange,
            "currency": self.currency,
            "is_active": self.is_active,
            "last_price": self.last_price,
            "last_change_pct": self.last_change_pct,
            "last_volume": self.last_volume,
            "avg_volume": self.avg_volume,
            "last_fetched_at": self.last_fetched_at.isoformat() if self.last_fetched_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

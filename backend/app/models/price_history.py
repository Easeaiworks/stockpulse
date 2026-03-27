from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class PriceSnapshot(Base):
    """Historical price data for trend analysis and reporting."""

    __tablename__ = "price_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    watchlist_item_id = Column(Integer, ForeignKey("watchlist_items.id"), nullable=False)
    symbol = Column(String(30), nullable=False, index=True)
    price = Column(Float, nullable=False)
    open_price = Column(Float, nullable=True)
    high_price = Column(Float, nullable=True)
    low_price = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    change_pct = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    fetched_at = Column(DateTime, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "symbol": self.symbol,
            "price": self.price,
            "open_price": self.open_price,
            "high_price": self.high_price,
            "low_price": self.low_price,
            "volume": self.volume,
            "change_pct": self.change_pct,
            "market_cap": self.market_cap,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None,
        }

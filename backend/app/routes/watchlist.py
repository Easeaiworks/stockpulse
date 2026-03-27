"""Watchlist CRUD API routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.models.watchlist import WatchlistItem
from app.services.market_data import fetch_quote

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


class AddItemRequest(BaseModel):
    symbol: str
    name: str
    security_type: str = "stock"
    exchange: Optional[str] = None
    currency: Optional[str] = None


class UpdateItemRequest(BaseModel):
    is_active: Optional[bool] = None


@router.get("")
def get_watchlist(db: Session = Depends(get_db)):
    """Get all watchlist items."""
    items = db.query(WatchlistItem).order_by(WatchlistItem.created_at.desc()).all()
    return {"items": [item.to_dict() for item in items]}


@router.post("")
def add_to_watchlist(req: AddItemRequest, db: Session = Depends(get_db)):
    """Add a security to the watchlist."""
    # Check if already exists
    existing = db.query(WatchlistItem).filter(WatchlistItem.symbol == req.symbol.upper()).first()
    if existing:
        if not existing.is_active:
            existing.is_active = True
            db.commit()
            return {"item": existing.to_dict(), "message": "Reactivated"}
        raise HTTPException(status_code=409, detail=f"{req.symbol} is already in your watchlist")

    item = WatchlistItem(
        symbol=req.symbol.upper(),
        name=req.name,
        security_type=req.security_type,
        exchange=req.exchange,
        currency=req.currency,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Immediately fetch current price
    quote = fetch_quote(item.symbol)
    if quote and quote.get("price") is not None:
        item.last_price = quote["price"]
        item.last_change_pct = quote.get("change_pct")
        item.last_volume = quote.get("volume")
        item.avg_volume = quote.get("avg_volume")
        from datetime import datetime
        item.last_fetched_at = datetime.utcnow()
        db.commit()
        db.refresh(item)

    return {"item": item.to_dict(), "message": "Added to watchlist"}


@router.patch("/{item_id}")
def update_watchlist_item(item_id: int, req: UpdateItemRequest, db: Session = Depends(get_db)):
    """Update a watchlist item (e.g., deactivate)."""
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if req.is_active is not None:
        item.is_active = req.is_active
    db.commit()
    db.refresh(item)
    return {"item": item.to_dict()}


@router.delete("/{item_id}")
def remove_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    """Remove a security from the watchlist entirely."""
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"message": f"{item.symbol} removed from watchlist"}


@router.post("/{item_id}/refresh")
def refresh_item(item_id: int, db: Session = Depends(get_db)):
    """Manually refresh data for a single watchlist item."""
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    quote = fetch_quote(item.symbol)
    if quote and quote.get("price") is not None:
        item.last_price = quote["price"]
        item.last_change_pct = quote.get("change_pct")
        item.last_volume = quote.get("volume")
        item.avg_volume = quote.get("avg_volume")
        from datetime import datetime
        item.last_fetched_at = datetime.utcnow()
        db.commit()
        db.refresh(item)
        return {"item": item.to_dict()}

    raise HTTPException(status_code=502, detail="Could not fetch data from market")

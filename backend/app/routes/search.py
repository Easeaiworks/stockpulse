"""Security search API routes."""
from fastapi import APIRouter, Query
from app.services.market_data import search_securities, fetch_history, fetch_options_chain

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
async def search(q: str = Query(..., min_length=1, description="Search query")):
    """Search for securities by name or ticker symbol."""
    results = await search_securities(q, limit=12)
    return {"results": results}


@router.get("/history/{symbol}")
def get_history(symbol: str, period: str = "1mo", interval: str = "1d"):
    """Get historical price data for charting."""
    data = fetch_history(symbol.upper(), period=period, interval=interval)
    return {"symbol": symbol.upper(), "period": period, "interval": interval, "data": data}


@router.get("/options/{symbol}")
def get_options(symbol: str):
    """Get options chain for a symbol."""
    data = fetch_options_chain(symbol.upper())
    if not data:
        return {"symbol": symbol.upper(), "available": False, "message": "No options data available"}
    return {"symbol": symbol.upper(), "available": True, **data}

"""Yahoo Finance data fetching service with multiple fallback methods."""
import yfinance as yf
from datetime import datetime
from typing import Optional
import logging
import httpx

logger = logging.getLogger(__name__)


async def _fetch_quote_via_api(symbol: str) -> Optional[dict]:
    """Fallback: fetch quote directly from Yahoo Finance v8 API."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
    params = {"interval": "1d", "range": "5d"}
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, headers=headers, timeout=15)
            resp.raise_for_status()
            data = resp.json()

        result = data.get("chart", {}).get("result", [])
        if not result:
            return None

        meta = result[0].get("meta", {})
        indicators = result[0].get("indicators", {}).get("quote", [{}])[0]

        price = meta.get("regularMarketPrice")
        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose")
        currency = meta.get("currency", "USD")

        volumes = indicators.get("volume", [])
        last_volume = None
        avg_volume = None
        if volumes:
            valid_vols = [v for v in volumes if v is not None]
            last_volume = valid_vols[-1] if valid_vols else None
            avg_volume = int(sum(valid_vols) / len(valid_vols)) if valid_vols else None

        change_pct = None
        if price and prev_close and prev_close > 0:
            change_pct = round(((price - prev_close) / prev_close) * 100, 2)

        return {
            "symbol": symbol,
            "name": meta.get("shortName", symbol),
            "price": price,
            "previous_close": prev_close,
            "open_price": meta.get("regularMarketOpen"),
            "high_price": meta.get("regularMarketDayHigh"),
            "low_price": meta.get("regularMarketDayLow"),
            "volume": last_volume,
            "avg_volume": avg_volume,
            "change_pct": change_pct,
            "market_cap": None,
            "currency": currency,
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.debug(f"API fallback failed for {symbol}: {e}")
        return None


async def search_securities(query: str, limit: int = 10) -> list[dict]:
    """
    Search for securities using Yahoo Finance's search API.
    Returns matching tickers with name, type, and exchange info.
    """
    if not query or len(query) < 1:
        return []

    url = "https://query2.finance.yahoo.com/v1/finance/search"
    params = {
        "q": query,
        "quotesCount": limit,
        "newsCount": 0,
        "listsCount": 0,
        "enableFuzzyQuery": True,
        "quotesQueryId": "tss_match_phrase_query",
    }
    headers = {"User-Agent": "Mozilla/5.0"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for quote in data.get("quotes", []):
            q_type = quote.get("quoteType", "").lower()
            security_type = "stock"
            if q_type == "etf":
                security_type = "etf"
            elif q_type == "mutualfund":
                security_type = "fund"
            elif q_type == "option":
                security_type = "option"
            elif q_type == "index":
                security_type = "index"

            results.append({
                "symbol": quote.get("symbol", ""),
                "name": quote.get("shortname") or quote.get("longname", "Unknown"),
                "security_type": security_type,
                "exchange": quote.get("exchange", ""),
                "exchange_display": quote.get("exchDisp", ""),
                "currency": quote.get("currency", ""),
            })

        return results
    except Exception as e:
        logger.error(f"Search failed for '{query}': {e}")
        return []


def fetch_quote(symbol: str) -> Optional[dict]:
    """
    Fetch current quote data for a single symbol.
    Uses ticker.info as primary source, with fast_info as fallback.
    """
    try:
        ticker = yf.Ticker(symbol)

        # Primary: use ticker.info (more reliable across yfinance versions)
        try:
            info = ticker.info
        except Exception:
            info = {}

        name = info.get("shortName") or info.get("longName", symbol)
        market_cap = info.get("marketCap")
        currency = info.get("currency", "USD")

        last_price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("previousClose")
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        open_price = info.get("open") or info.get("regularMarketOpen")
        day_high = info.get("dayHigh") or info.get("regularMarketDayHigh")
        day_low = info.get("dayLow") or info.get("regularMarketDayLow")
        last_volume = info.get("volume") or info.get("regularMarketVolume")
        avg_volume = info.get("averageVolume") or info.get("averageDailyVolume10Day")

        # Fallback: try fast_info if primary fields are missing
        if last_price is None:
            try:
                fi = ticker.fast_info
                last_price = getattr(fi, "last_price", None)
                prev_close = prev_close or getattr(fi, "previous_close", None)
                open_price = open_price or getattr(fi, "open", None)
                day_high = day_high or getattr(fi, "day_high", None)
                day_low = day_low or getattr(fi, "day_low", None)
                last_volume = last_volume or getattr(fi, "last_volume", None)
            except Exception:
                pass

        # Last resort: get latest close from history
        if last_price is None:
            try:
                hist = ticker.history(period="5d")
                if not hist.empty:
                    last_price = round(hist["Close"].iloc[-1], 2)
                    last_volume = int(hist["Volume"].iloc[-1])
                    if len(hist) >= 2:
                        prev_close = round(hist["Close"].iloc[-2], 2)
            except Exception:
                pass

        # Final fallback: direct API call
        if last_price is None:
            try:
                import asyncio
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    loop = None

                if loop and loop.is_running():
                    # We're in an async context, can't use asyncio.run
                    logger.warning(f"No price data via yfinance for {symbol}, will retry via API next cycle")
                    return None
                else:
                    api_result = asyncio.run(_fetch_quote_via_api(symbol))
                    if api_result:
                        return api_result
            except Exception as e:
                logger.debug(f"API fallback also failed for {symbol}: {e}")

        if last_price is None:
            logger.warning(f"No price data found for {symbol}")
            return None

        change_pct = None
        if last_price and prev_close and prev_close > 0:
            change_pct = round(((last_price - prev_close) / prev_close) * 100, 2)

        return {
            "symbol": symbol,
            "name": name,
            "price": last_price,
            "previous_close": prev_close,
            "open_price": open_price,
            "high_price": day_high,
            "low_price": day_low,
            "volume": last_volume,
            "avg_volume": avg_volume,
            "change_pct": change_pct,
            "market_cap": market_cap,
            "currency": currency,
            "fetched_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Failed to fetch quote for {symbol}: {e}")
        return None


def fetch_history(symbol: str, period: str = "1mo", interval: str = "1d") -> list[dict]:
    """Fetch historical price data for charts."""
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)

        data = []
        for date, row in hist.iterrows():
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "open": round(row["Open"], 2),
                "high": round(row["High"], 2),
                "low": round(row["Low"], 2),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"]),
            })
        return data
    except Exception as e:
        logger.error(f"Failed to fetch history for {symbol}: {e}")
        return []


def fetch_options_chain(symbol: str) -> Optional[dict]:
    """Fetch available options data for a symbol."""
    try:
        ticker = yf.Ticker(symbol)
        expirations = ticker.options

        if not expirations:
            return None

        # Get the nearest expiration by default
        nearest = expirations[0]
        chain = ticker.option_chain(nearest)

        calls = []
        for _, row in chain.calls.iterrows():
            calls.append({
                "strike": row["strike"],
                "last_price": row["lastPrice"],
                "bid": row["bid"],
                "ask": row["ask"],
                "volume": int(row["volume"]) if row["volume"] == row["volume"] else 0,
                "open_interest": int(row["openInterest"]) if row["openInterest"] == row["openInterest"] else 0,
                "implied_volatility": round(row["impliedVolatility"] * 100, 2),
            })

        puts = []
        for _, row in chain.puts.iterrows():
            puts.append({
                "strike": row["strike"],
                "last_price": row["lastPrice"],
                "bid": row["bid"],
                "ask": row["ask"],
                "volume": int(row["volume"]) if row["volume"] == row["volume"] else 0,
                "open_interest": int(row["openInterest"]) if row["openInterest"] == row["openInterest"] else 0,
                "implied_volatility": round(row["impliedVolatility"] * 100, 2),
            })

        return {
            "symbol": symbol,
            "expirations": list(expirations),
            "selected_expiration": nearest,
            "calls": calls,
            "puts": puts,
        }
    except Exception as e:
        logger.error(f"Failed to fetch options for {symbol}: {e}")
        return None

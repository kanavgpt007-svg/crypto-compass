"""
Crypto Analysis Backend
========================
FastAPI server that powers the frontend analysis page.

Endpoints:
  GET /api/market/klines?symbol=BTC/USDT&interval=1h&limit=200
  GET /api/market/ticker?symbol=BTC/USDT
  GET /api/analysis?symbol=BTC/USDT&interval=1h
  GET /api/news?symbol=BTC/USDT&limit=8

Data sources:
  - Bybit public REST API     (https://api.bybit.com)  -> klines + ticker
  - TradingView public widget (chart is embedded on the frontend; no key needed)
  - CryptoPanic public feed for news (no key required, optional)

Run:
  pip install fastapi uvicorn httpx numpy
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from analysis import run_analysis

# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000,https://*.lovable.app,https://*.lovableproject.com",
).split(",")

app = FastAPI(title="Crypto Analysis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # public read-only data; tighten in prod
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
BYBIT_BASE = "https://api.bybit.com"
BYBIT_CATEGORY = "spot"  # use "linear" for USDT perpetual futures

# Map frontend timeframe -> Bybit kline interval
# Bybit uses minutes as numbers, plus D / W / M for day/week/month
INTERVAL_MAP = {
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "1h": "60",
    "4h": "240",
    "1d": "D",
    "1M": "M",
}


def to_bybit_symbol(symbol: str) -> str:
    """Convert 'BTC/USDT' -> 'BTCUSDT'."""
    return symbol.replace("/", "").upper()


async def fetch_json(url: str, params: dict | None = None) -> Any:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"Upstream error: {r.text[:200]}")
        return r.json()


async def bybit_get(path: str, params: dict) -> dict:
    """Call Bybit V5 endpoint and unwrap the standard {retCode, result} envelope."""
    data = await fetch_json(f"{BYBIT_BASE}{path}", params)
    if data.get("retCode") != 0:
        raise HTTPException(502, f"Bybit error: {data.get('retMsg', 'unknown')}")
    return data.get("result") or {}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"ok": True, "service": "crypto-analysis-api", "source": "bybit"}


@app.get("/api/market/klines")
async def klines(
    symbol: str = Query(..., examples=["BTC/USDT"]),
    interval: str = Query("1h"),
    limit: int = Query(200, ge=10, le=1000),
):
    if interval not in INTERVAL_MAP:
        raise HTTPException(400, f"Unsupported interval: {interval}")

    result = await bybit_get(
        "/v5/market/kline",
        {
            "category": BYBIT_CATEGORY,
            "symbol": to_bybit_symbol(symbol),
            "interval": INTERVAL_MAP[interval],
            "limit": min(limit, 1000),
        },
    )

    # Bybit returns newest-first: [start, open, high, low, close, volume, turnover]
    raw = list(reversed(result.get("list") or []))
    candles = [
        {
            "time": int(int(c[0]) // 1000),
            "open": float(c[1]),
            "high": float(c[2]),
            "low": float(c[3]),
            "close": float(c[4]),
            "volume": float(c[5]),
        }
        for c in raw
    ]
    return {"symbol": symbol, "interval": interval, "candles": candles}


@app.get("/api/market/ticker")
async def ticker(symbol: str = Query(...)):
    result = await bybit_get(
        "/v5/market/tickers",
        {"category": BYBIT_CATEGORY, "symbol": to_bybit_symbol(symbol)},
    )
    items = result.get("list") or []
    if not items:
        raise HTTPException(404, f"Ticker not found for {symbol}")
    t = items[0]
    last = float(t["lastPrice"])
    pct = float(t.get("price24hPcnt", 0)) * 100.0
    prev = float(t.get("prevPrice24h", last))
    return {
        "symbol": symbol,
        "price": last,
        "change": last - prev,
        "changePercent": pct,
        "high24h": float(t.get("highPrice24h", 0)),
        "low24h": float(t.get("lowPrice24h", 0)),
        "volume24h": float(t.get("volume24h", 0)),
    }


@app.get("/api/analysis")
async def analysis(
    symbol: str = Query(...),
    interval: str = Query("1h"),
):
    if interval not in INTERVAL_MAP:
        raise HTTPException(400, f"Unsupported interval: {interval}")

    result = await bybit_get(
        "/v5/market/kline",
        {
            "category": BYBIT_CATEGORY,
            "symbol": to_bybit_symbol(symbol),
            "interval": INTERVAL_MAP[interval],
            "limit": 500,
        },
    )
    raw = list(reversed(result.get("list") or []))
    candles = [
        {
            "time": int(int(c[0]) // 1000),
            "open": float(c[1]),
            "high": float(c[2]),
            "low": float(c[3]),
            "close": float(c[4]),
            "volume": float(c[5]),
        }
        for c in raw
    ]

    analysis_result = run_analysis(candles)
    return {"symbol": symbol, "interval": interval, **analysis_result}


@app.get("/api/news")
async def news(symbol: str = Query(...), limit: int = Query(8, ge=1, le=30)):
    """
    Pulls free crypto news from CryptoPanic public feed.
    No API key required for the public endpoint.
    """
    base = symbol.split("/")[0].upper()
    url = "https://cryptopanic.com/api/v1/posts/"
    try:
        data = await fetch_json(
            url,
            {"public": "true", "currencies": base, "kind": "news"},
        )
        items = [
            {
                "id": str(p.get("id")),
                "title": p.get("title"),
                "url": p.get("url"),
                "source": (p.get("source") or {}).get("title", "CryptoPanic"),
                "publishedAt": p.get("published_at"),
            }
            for p in (data.get("results") or [])[:limit]
        ]
        return {"symbol": symbol, "items": items}
    except Exception:
        return {"symbol": symbol, "items": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

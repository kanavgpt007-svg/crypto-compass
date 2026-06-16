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
  - Binance public REST API  (https://api.binance.com)  -> klines + ticker
  - TradingView public widget (chart is embedded on the frontend; no key needed)
  - CryptoPanic / RSS fallback for news (no key required, optional)

Run:
  pip install fastapi uvicorn httpx numpy
  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
import time
from typing import Any
from urllib.parse import quote

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
BINANCE_BASE = "https://api.binance.com"

# Map frontend timeframe -> Binance interval
INTERVAL_MAP = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1M": "1M",
}


def to_binance_symbol(symbol: str) -> str:
    """Convert 'BTC/USDT' -> 'BTCUSDT'."""
    return symbol.replace("/", "").upper()


async def fetch_json(url: str, params: dict | None = None) -> Any:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, params=params)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"Upstream error: {r.text[:200]}")
        return r.json()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"ok": True, "service": "crypto-analysis-api"}


@app.get("/api/market/klines")
async def klines(
    symbol: str = Query(..., examples=["BTC/USDT"]),
    interval: str = Query("1h"),
    limit: int = Query(200, ge=10, le=1000),
):
    if interval not in INTERVAL_MAP:
        raise HTTPException(400, f"Unsupported interval: {interval}")

    raw = await fetch_json(
        f"{BINANCE_BASE}/api/v3/klines",
        {"symbol": to_binance_symbol(symbol), "interval": INTERVAL_MAP[interval], "limit": limit},
    )

    candles = [
        {
            "time": int(c[0] // 1000),
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
    data = await fetch_json(
        f"{BINANCE_BASE}/api/v3/ticker/24hr",
        {"symbol": to_binance_symbol(symbol)},
    )
    return {
        "symbol": symbol,
        "price": float(data["lastPrice"]),
        "change": float(data["priceChange"]),
        "changePercent": float(data["priceChangePercent"]),
        "high24h": float(data["highPrice"]),
        "low24h": float(data["lowPrice"]),
        "volume24h": float(data["volume"]),
    }


@app.get("/api/analysis")
async def analysis(
    symbol: str = Query(...),
    interval: str = Query("1h"),
):
    if interval not in INTERVAL_MAP:
        raise HTTPException(400, f"Unsupported interval: {interval}")

    raw = await fetch_json(
        f"{BINANCE_BASE}/api/v3/klines",
        {"symbol": to_binance_symbol(symbol), "interval": INTERVAL_MAP[interval], "limit": 500},
    )
    candles = [
        {
            "time": int(c[0] // 1000),
            "open": float(c[1]),
            "high": float(c[2]),
            "low": float(c[3]),
            "close": float(c[4]),
            "volume": float(c[5]),
        }
        for c in raw
    ]

    result = run_analysis(candles)
    return {"symbol": symbol, "interval": interval, **result}


@app.get("/api/news")
async def news(symbol: str = Query(...), limit: int = Query(8, ge=1, le=30)):
    """
    Pulls free crypto news from CryptoPanic public feed.
    No API key required for the public RSS-style JSON endpoint.
    """
    base = symbol.split("/")[0].lower()
    url = "https://cryptopanic.com/api/v1/posts/"
    try:
        data = await fetch_json(
            url,
            {"public": "true", "currencies": base.upper(), "kind": "news"},
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
        # Graceful fallback so the frontend never breaks
        return {"symbol": symbol, "items": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

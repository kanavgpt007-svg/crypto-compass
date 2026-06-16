# Crypto Analysis Backend

Two files, zero database. Powers the `/analysis` page.

## Files
- `main.py` — FastAPI server + Binance proxy + news + routes
- `analysis.py` — ~40 indicators + ~40 candlestick patterns + summary engine

## Data sources
- **Binance public REST** — klines (OHLCV) & 24h ticker. No API key needed.
- **TradingView** — chart widget is embedded on the frontend (no server call).
- **CryptoPanic public feed** — free news endpoint (no key).

## Install & run
```bash
cd backend
pip install fastapi uvicorn httpx numpy
uvicorn main:app --reload --port 8000
```

Server runs at `http://localhost:8000`.

## Endpoints
| Method | Path | Query |
|---|---|---|
| GET | `/api/market/klines` | `symbol=BTC/USDT&interval=1h&limit=200` |
| GET | `/api/market/ticker` | `symbol=BTC/USDT` |
| GET | `/api/analysis`      | `symbol=BTC/USDT&interval=1h` |
| GET | `/api/news`          | `symbol=BTC/USDT&limit=8` |

Intervals: `1m 5m 15m 1h 4h 1d 1M`.

## Connect the frontend
The frontend reads `VITE_API_URL`. For local dev create `.env`:
```
VITE_API_URL=http://localhost:8000
```

For the deployed Lovable preview to reach your backend, expose it
publicly (ngrok / Cloudflare Tunnel / Render / Railway / Fly) and set
`VITE_API_URL` in Lovable → Project Settings → Environment Variables.

## CORS
Open to all origins by default. Tighten via `ALLOWED_ORIGINS` env var in production.

// API client for the CryptoMind Python (FastAPI) backend.
// Configure the backend URL via VITE_API_URL in .env (defaults to http://localhost:8000).

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1M";

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change: number;       // 24h % change
  high: number;
  low: number;
  volume: number;
}

export type Signal =
  | "STRONG BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG SELL";

export interface Indicator {
  name: string;
  value: string;
  signal: Signal;
  description: string;
  category: string;
}

export interface Pattern {
  name: string;
  detected: boolean;
  signal: string;       // BUY / SELL / NEUTRAL
  reliability: string;
  description: string;
  category: string;
}

export interface Summary {
  label: Signal;
  score: number;        // -1 .. +1
  counts: Record<string, number>;
}

export interface AnalysisResponse {
  symbol: string;
  interval: Timeframe;
  ticker?: Ticker;
  indicators: Indicator[];
  patterns: Pattern[];
  summary: Summary;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  time: string;         // ISO or relative
  snippet?: string;
}

async function http<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  klines: async (symbol: string, interval: Timeframe, limit = 200): Promise<Candle[]> => {
    const r = await http<any>("/api/market/klines", { symbol, interval, limit });
    if (Array.isArray(r)) return r as Candle[];
    if (r && Array.isArray(r.candles)) return r.candles as Candle[];
    return [];
  },

  ticker: (symbol: string) =>
    http<Ticker>("/api/market/ticker", { symbol }),

  analysis: (symbol: string, interval: Timeframe) =>
    http<AnalysisResponse>("/api/analysis", { symbol, interval }),

  news: async (symbol: string, limit = 8): Promise<NewsItem[]> => {
    const r = await http<any>("/api/news", { symbol, limit });
    if (Array.isArray(r)) return r as NewsItem[];
    if (r && Array.isArray(r.items)) return r.items as NewsItem[];
    if (r && Array.isArray(r.results)) return r.results as NewsItem[];
    return [];
  },
};

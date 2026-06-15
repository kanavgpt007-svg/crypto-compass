// Mock analysis data. Replace with Python backend responses later.
export type Signal = "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1M"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const SUGGESTED_PAIRS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
  "ADA/USDT", "DOGE/USDT", "AVAX/USDT", "MATIC/USDT", "DOT/USDT",
  "LINK/USDT", "TRX/USDT", "LTC/USDT", "ATOM/USDT", "NEAR/USDT",
  "APT/USDT", "ARB/USDT", "OP/USDT", "SUI/USDT", "INJ/USDT",
];

export const INDICATORS = [
  "RSI (14)", "Stochastic %K (14,3,3)", "Stochastic RSI Fast (3,3,14,14)",
  "MACD (12,26)", "ADX (14)", "Williams %R", "CCI (14)", "ATR (14)",
  "Highs/Lows (14)", "Ultimate Oscillator", "ROC", "Bull/Bear Power (13)",
  "Awesome Oscillator", "Momentum (10)", "MFI (14)", "OBV", "DMI (+/-)",
  "Parabolic SAR", "Ichimoku Base Line", "TRIX (14)", "Vortex Indicator",
  "Chaikin Money Flow", "Chaikin Oscillator", "Aroon Oscillator",
  "Force Index", "Mass Index", "Keltner Channel", "Donchian Channel",
  "Bollinger Bands %B", "Standard Deviation", "MA5 (SMA)", "MA10 (EMA)",
  "MA20 (SMA)", "MA50 (EMA)", "MA100 (SMA)", "MA200 (EMA)",
  "Hull MA (9)", "VWAP", "Supertrend (10,3)", "ZigZag", "Pivot Points",
  "Fibonacci Retracement",
];

export const PATTERNS = [
  "Doji", "Dragonfly Doji", "Gravestone Doji", "Long-Legged Doji",
  "Hammer", "Inverted Hammer", "Hanging Man", "Shooting Star",
  "Bullish Engulfing", "Bearish Engulfing", "Bullish Harami", "Bearish Harami",
  "Harami Cross", "Piercing Line", "Dark Cloud Cover", "Morning Star",
  "Evening Star", "Morning Doji Star", "Evening Doji Star",
  "Three White Soldiers", "Three Black Crows", "Three Inside Up",
  "Three Inside Down", "Three Outside Up", "Three Outside Down",
  "Tweezer Top", "Tweezer Bottom", "Marubozu", "Spinning Top",
  "Belt Hold (Bullish)", "Belt Hold (Bearish)", "Kicker (Bullish)",
  "Kicker (Bearish)", "Abandoned Baby", "Tri-Star", "Rising Three Methods",
  "Falling Three Methods", "Mat Hold", "Stick Sandwich",
  "Concealing Baby Swallow", "Unique Three River Bottom", "Breakaway",
];

// Deterministic pseudo-random per pair+timeframe (so signals feel stable)
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function rng(seed: number) {
  let s = seed || 1;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

const SIGNAL_BUCKETS: Signal[] = ["STRONG_SELL", "SELL", "NEUTRAL", "BUY", "STRONG_BUY"];

export function getIndicatorAnalysis(pair: string, tf: Timeframe) {
  const r = rng(hash(pair + tf + "ind"));
  return INDICATORS.map((name) => {
    const value = (r() * 200 - 100).toFixed(2);
    const sig = SIGNAL_BUCKETS[Math.floor(r() * 5)];
    return { name, value, signal: sig };
  });
}

export function getPatternAnalysis(pair: string, tf: Timeframe) {
  const r = rng(hash(pair + tf + "pat"));
  return PATTERNS.map((name) => {
    const detected = r() > 0.55;
    const sig = detected ? SIGNAL_BUCKETS[Math.floor(r() * 5)] : "NEUTRAL";
    const bars = detected ? Math.floor(r() * 20) + 1 : 0;
    return { name, detected, signal: sig as Signal, bars };
  });
}

export function summarize(signals: Signal[]) {
  const counts = { STRONG_BUY: 0, BUY: 0, NEUTRAL: 0, SELL: 0, STRONG_SELL: 0 };
  signals.forEach((s) => counts[s]++);
  const score =
    counts.STRONG_BUY * 2 + counts.BUY - counts.SELL - counts.STRONG_SELL * 2;
  const total = signals.length || 1;
  const normalized = score / (total * 2); // -1..1
  let label: Signal = "NEUTRAL";
  if (normalized > 0.5) label = "STRONG_BUY";
  else if (normalized > 0.15) label = "BUY";
  else if (normalized < -0.5) label = "STRONG_SELL";
  else if (normalized < -0.15) label = "SELL";
  return { counts, score: normalized, label };
}

// OHLC candle generation for chart preview
export function getCandles(pair: string, tf: Timeframe, n = 60) {
  const r = rng(hash(pair + tf));
  const base = 100 + (hash(pair) % 50000) / 100;
  let price = base;
  const out: { i: number; o: number; h: number; l: number; c: number; range: [number, number] }[] = [];
  for (let i = 0; i < n; i++) {
    const o = price;
    const change = (r() - 0.48) * base * 0.02;
    const c = Math.max(0.01, o + change);
    const h = Math.max(o, c) + r() * base * 0.01;
    const l = Math.min(o, c) - r() * base * 0.01;
    out.push({ i, o, h, l, c, range: [l, h] });
    price = c;
  }
  return out;
}

export function getNews(pair: string) {
  const base = pair.split("/")[0];
  const r = rng(hash(pair + "news"));
  const headlines = [
    `${base} consolidates as institutional flows pick up`,
    `Analysts revise ${base} target after ETF inflow surge`,
    `On-chain data shows ${base} accumulation by whales`,
    `${base} options open interest hits monthly high`,
    `Macro outlook weighs on ${base} short-term momentum`,
    `${base} network activity climbs to 30-day peak`,
  ];
  const sources = ["CoinDesk", "Bloomberg", "Reuters", "The Block", "Decrypt"];
  return headlines.map((h) => ({
    title: h,
    source: sources[Math.floor(r() * sources.length)],
    time: `${Math.floor(r() * 12) + 1}h ago`,
  }));
}

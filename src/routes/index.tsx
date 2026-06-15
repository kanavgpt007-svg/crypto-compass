import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, LineChart, CandlestickChart, Gauge, Newspaper } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quantix — Professional Crypto Analysis" },
      { name: "description", content: "Multi-timeframe technical and candlestick analysis across 40+ indicators and 40+ chart patterns." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 opacity-40"
          style={{ backgroundImage:
            "radial-gradient(60% 50% at 50% 0%, oklch(0.78 0.16 195 / 0.18), transparent), radial-gradient(40% 40% at 80% 20%, oklch(0.65 0.22 25 / 0.10), transparent)" }} />
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="flex items-center gap-2 text-xs font-mono text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bull" />
            LIVE · 20+ PAIRS · 7 TIMEFRAMES
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Institutional-grade crypto analysis.
            <span className="block text-primary">Built for traders who read the tape.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Quantix aggregates 40+ technical indicators and 40+ candlestick patterns across every timeframe, then condenses them into a single, defensible signal per pair.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/analysis" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Launch analysis terminal <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/about" className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-5 py-3 text-sm font-medium hover:bg-surface-elevated">
              About Quantix
            </Link>
          </div>

          {/* Ticker preview */}
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { p: "BTC/USDT", v: "67,420", c: "+1.84%", up: true },
              { p: "ETH/USDT", v: "3,512", c: "+0.62%", up: true },
              { p: "SOL/USDT", v: "172.30", c: "-2.14%", up: false },
              { p: "XRP/USDT", v: "0.5824", c: "+3.27%", up: true },
            ].map((t) => (
              <div key={t.p} className="rounded-lg border border-border bg-surface p-4">
                <div className="text-xs text-muted-foreground">{t.p}</div>
                <div className="mt-1 font-mono text-xl font-semibold">{t.v}</div>
                <div className={`mt-1 font-mono text-xs ${t.up ? "text-bull" : "text-bear"}`}>{t.c}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Everything a discretionary trader checks — in one screen.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: LineChart, t: "40+ Indicators", d: "RSI, MACD, Ichimoku, Supertrend, VWAP and more — recomputed per timeframe." },
            { icon: CandlestickChart, t: "40+ Patterns", d: "Engulfing, Harami, Morning Star and the rest, scored against recent price action." },
            { icon: Gauge, t: "Signal Meter", d: "A consolidated buy/sell gauge for every timeframe so you don't second-guess the bias." },
            { icon: Newspaper, t: "Pair News", d: "Latest headlines for the symbol you're analyzing, side-by-side with the chart." },
          ].map((f) => (
            <div key={t} className="rounded-xl border border-border bg-surface p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

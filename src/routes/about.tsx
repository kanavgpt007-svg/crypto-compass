import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Quantix" },
      { name: "description", content: "Quantix is a free, professional crypto analysis terminal: 40+ indicators, 40+ candlestick patterns, multi-timeframe signals." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wider text-primary">About</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight">A trader's terminal — without the price tag.</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        Quantix is a free, professional-grade crypto analysis platform. We aggregate the same indicators and pattern recognition that institutional desks rely on, and present them in a single, fast interface.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-semibold">What we do</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            For any crypto pair you enter, Quantix computes 40+ technical indicators and scans for 40+ candlestick patterns across seven timeframes — 1m, 5m, 15m, 1h, 4h, 1d, 1M — and condenses everything into one buy/sell bias per timeframe.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-semibold">How it works</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The frontend is a TypeScript / React terminal. Analysis is powered by a Python backend that crunches OHLCV data, runs indicator math, detects patterns, and serves the signals over a typed API.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-semibold">Who it's for</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Active traders who don't want to flip between five tabs. Swing traders cross-referencing timeframes. Anyone tired of paid platforms charging for signals you can derive yourself.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="font-semibold">Not financial advice</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Signals are computed from public price data and are for educational use. Always do your own research; markets can and will move against any indicator.
          </p>
        </div>
      </div>
    </div>
  );
}

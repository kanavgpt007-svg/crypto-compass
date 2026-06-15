import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, TrendingUp, Clock, ExternalLink } from "lucide-react";
import {
  SUGGESTED_PAIRS,
  TIMEFRAMES,
  type Timeframe,
  getIndicatorAnalysis,
  getPatternAnalysis,
  summarize,
  getNews,
} from "@/lib/analysis-data";
import { SignalBadge } from "@/components/SignalBadge";
import { SignalGauge } from "@/components/SignalGauge";
import { PriceChart } from "@/components/PriceChart";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Analysis Terminal — Quantix" },
      { name: "description", content: "Search any crypto pair to see 40+ indicators, 40+ candlestick patterns, and a consolidated buy/sell signal per timeframe." },
    ],
  }),
  component: Analysis,
});

function Analysis() {
  const [pair, setPair] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tf, setTf] = useState<Timeframe>("1h");
  const [mode, setMode] = useState<"technical" | "candlestick">("technical");

  const normalize = (s: string) => {
    const t = s.trim().toUpperCase();
    if (!t) return null;
    if (t.includes("/")) return t;
    return `${t}/USDT`;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalize(query);
    if (p) setPair(p);
  };

  if (!pair) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-primary">Analysis Terminal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">What pair do you want to analyse?</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Enter any symbol — we'll quote it against USDT by default. 40+ indicators, 40+ patterns, every timeframe.
        </p>

        <form onSubmit={submit} className="mt-10 w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. BTC, ETH/USDT, SOL"
              className="w-full rounded-xl border border-border bg-surface px-12 py-4 text-lg outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >Analyse</button>
          </div>
        </form>

        <div className="mt-10 w-full">
          <p className="text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Suggested pairs</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_PAIRS.map((p) => (
              <button
                key={p}
                onClick={() => setPair(p)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 font-mono text-xs hover:border-primary hover:text-primary"
              >{p}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <AnalysisView pair={pair} tf={tf} setTf={setTf} mode={mode} setMode={setMode} onReset={() => { setPair(null); setQuery(""); }} />;
}

function AnalysisView({
  pair, tf, setTf, mode, setMode, onReset,
}: {
  pair: string; tf: Timeframe; setTf: (t: Timeframe) => void;
  mode: "technical" | "candlestick"; setMode: (m: "technical" | "candlestick") => void;
  onReset: () => void;
}) {
  const indicators = useMemo(() => getIndicatorAnalysis(pair, tf), [pair, tf]);
  const patterns = useMemo(() => getPatternAnalysis(pair, tf), [pair, tf]);
  const news = useMemo(() => getNews(pair), [pair]);

  const indSummary = useMemo(() => summarize(indicators.map((i) => i.signal)), [indicators]);
  const patSummary = useMemo(
    () => summarize(patterns.filter((p) => p.detected).map((p) => p.signal)),
    [patterns]
  );
  const overall = useMemo(() => {
    const combined = [...indicators.map((i) => i.signal), ...patterns.filter((p) => p.detected).map((p) => p.signal)];
    return summarize(combined.length ? combined : indicators.map((i) => i.signal));
  }, [indicators, patterns]);

  // per-timeframe summaries for sidebar
  const perTf = useMemo(
    () => TIMEFRAMES.map((t) => {
      const inds = getIndicatorAnalysis(pair, t).map((i) => i.signal);
      const pats = getPatternAnalysis(pair, t).filter((p) => p.detected).map((p) => p.signal);
      return { tf: t, ...summarize([...inds, ...pats]) };
    }),
    [pair]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Pair header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{pair}</h1>
          <SignalBadge signal={overall.label} size="md" />
        </div>
        <button onClick={onReset} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-elevated">
          ← Change pair
        </button>
      </div>

      {/* Timeframe selector */}
      <div className="mt-4 inline-flex rounded-lg border border-border bg-surface p-1">
        {TIMEFRAMES.map((t) => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition ${
              tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >{t}</button>
        ))}
      </div>

      {/* Chart + sidebar */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
        <PriceChart pair={pair} tf={tf} />

        {/* Right-side per-timeframe gauge */}
        <aside className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Signal by timeframe</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Consolidated indicator + pattern bias.</p>
          <div className="mt-4 space-y-3">
            {perTf.map((row) => (
              <button
                key={row.tf}
                onClick={() => setTf(row.tf)}
                className={`block w-full rounded-lg border p-3 text-left transition ${
                  tf === row.tf ? "border-primary bg-primary/5" : "border-border hover:bg-surface-elevated"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{row.tf}</span>
                  <SignalBadge signal={row.label} />
                </div>
                <div className="mt-2"><SignalGauge score={row.score} label={row.label} /></div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {/* Mode toggle */}
      <div className="mt-8 flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface p-1">
          {(["technical", "candlestick"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >{m} analysis</button>
          ))}
        </div>
        <div className="hidden text-xs text-muted-foreground sm:block">
          Summary on <span className="font-mono uppercase text-foreground">{tf}</span> · {mode === "technical" ? indSummary.counts.BUY + indSummary.counts.STRONG_BUY : patSummary.counts.BUY + patSummary.counts.STRONG_BUY} bullish ·{" "}
          {mode === "technical" ? indSummary.counts.SELL + indSummary.counts.STRONG_SELL : patSummary.counts.SELL + patSummary.counts.STRONG_SELL} bearish
        </div>
      </div>

      {/* Analysis table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {mode === "technical" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Indicator</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">Signal</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.name} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50">
                  <td className="px-4 py-2.5">{i.name}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{i.value}</td>
                  <td className="px-4 py-2.5 text-right"><SignalBadge signal={i.signal} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Pattern</th>
                <th className="px-4 py-3">Detected</th>
                <th className="px-4 py-3">Bars ago</th>
                <th className="px-4 py-3 text-right">Signal</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.name} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50">
                  <td className="px-4 py-2.5">{p.name}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.detected ? "Yes" : "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.detected ? p.bars : "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    {p.detected ? <SignalBadge signal={p.signal} /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* News */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest news — {pair.split("/")[0]}</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">last 24h</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {news.map((n, idx) => (
            <a key={idx} href="#" className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{n.source}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{n.time}</span>
              </div>
              <h3 className="mt-2 font-medium leading-snug group-hover:text-primary">{n.title}</h3>
              <ExternalLink className="mt-3 h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp, Clock, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { SUGGESTED_PAIRS, TIMEFRAMES } from "@/lib/analysis-data";
import { api, type Timeframe, type Summary } from "@/lib/api";
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
  const klinesQ = useQuery({
    queryKey: ["klines", pair, tf],
    queryFn: () => api.klines(pair, tf, 200),
    refetchInterval: 30_000,
  });

  const analysisQ = useQuery({
    queryKey: ["analysis", pair, tf],
    queryFn: () => api.analysis(pair, tf),
    refetchInterval: 60_000,
  });

  const newsQ = useQuery({
    queryKey: ["news", pair],
    queryFn: () => api.news(pair, 8),
    refetchInterval: 5 * 60_000,
  });

  // per-timeframe summary sidebar (parallel queries)
  const perTfQueries = TIMEFRAMES.map((t) =>
    useQuery({
      queryKey: ["analysis-summary", pair, t],
      queryFn: () => api.analysis(pair, t).then((a) => a.summary),
      staleTime: 60_000,
    })
  );

  const indicators = analysisQ.data?.indicators ?? [];
  const patterns = analysisQ.data?.patterns ?? [];
  const overall: Summary = analysisQ.data?.summary ?? { label: "NEUTRAL", score: 0, counts: {} };
  const newsItems = Array.isArray(newsQ.data) ? newsQ.data : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Pair header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{pair}</h1>
          <SignalBadge signal={overall.label} size="md" />
          {analysisQ.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <button onClick={onReset} className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs hover:bg-surface-elevated">
          ← Change pair
        </button>
      </div>

      {(klinesQ.error || analysisQ.error) && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-bear/40 bg-bear/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-bear" />
          <div>
            <p className="font-medium text-bear">Backend unreachable</p>
            <p className="text-muted-foreground">
              {(klinesQ.error || analysisQ.error)?.toString()}<br />
              Make sure your FastAPI server is running and <code className="font-mono">VITE_API_URL</code> points to it.
            </p>
          </div>
        </div>
      )}

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
        {klinesQ.isLoading ? (
          <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading chart…
          </div>
        ) : (
          <PriceChart pair={pair} tf={tf} candles={Array.isArray(klinesQ.data) ? klinesQ.data : []} />
        )}

        <aside className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Signal by timeframe</h3>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Consolidated indicator + pattern bias.</p>
          <div className="mt-4 space-y-3">
            {TIMEFRAMES.map((t, idx) => {
              const q = perTfQueries[idx];
              const s = q.data;
              return (
                <button
                  key={t}
                  onClick={() => setTf(t)}
                  className={`block w-full rounded-lg border p-3 text-left transition ${
                    tf === t ? "border-primary bg-primary/5" : "border-border hover:bg-surface-elevated"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t}</span>
                    {s ? <SignalBadge signal={s.label} /> : (
                      <span className="font-mono text-[10px] text-muted-foreground/60">
                        {q.isLoading ? "…" : "—"}
                      </span>
                    )}
                  </div>
                  {s && <div className="mt-2"><SignalGauge score={s.score} label={s.label} /></div>}
                </button>
              );
            })}
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
      </div>

      {/* Analysis table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
        {analysisQ.isLoading ? (
          <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Computing analysis…
          </div>
        ) : mode === "technical" ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Indicator</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3 text-right">Signal</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((i) => (
                <tr key={i.name} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50">
                  <td className="px-4 py-2.5">{i.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{i.category}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{i.value}</td>
                  <td className="px-4 py-2.5 text-right"><SignalBadge signal={i.signal} /></td>
                </tr>
              ))}
              {indicators.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">No indicator data.</td></tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-elevated text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Pattern</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Detected</th>
                <th className="px-4 py-3">Reliability</th>
                <th className="px-4 py-3 text-right">Signal</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.name} className="border-b border-border/50 last:border-0 hover:bg-surface-elevated/50">
                  <td className="px-4 py-2.5">{p.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{p.detected ? "Yes" : "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.reliability}</td>
                  <td className="px-4 py-2.5 text-right">
                    {p.detected ? <SignalBadge signal={p.signal} /> : <span className="font-mono text-xs text-muted-foreground/60">—</span>}
                  </td>
                </tr>
              ))}
              {patterns.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-sm text-muted-foreground">No patterns reported.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* News */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest news — {pair.split("/")[0]}</h2>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">live</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {newsQ.isLoading && (
            <div className="col-span-full flex items-center justify-center rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading news…
            </div>
          )}
          {newsItems.map((n, idx) => (
            <a key={idx} href={n.url} target="_blank" rel="noreferrer"
              className="group rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{n.source}</span>
                <span>·</span>
                <Clock className="h-3 w-3" />
                <span>{n.time}</span>
              </div>
              <h3 className="mt-2 font-medium leading-snug group-hover:text-primary">{n.title}</h3>
              {n.snippet && <p className="mt-1 text-xs text-muted-foreground">{n.snippet}</p>}
              <ExternalLink className="mt-3 h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
          {!newsQ.isLoading && newsItems.length === 0 && (
            <div className="col-span-full rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
              No news available.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import { useMemo } from "react";
import { getCandles, type Timeframe } from "@/lib/analysis-data";

export function PriceChart({ pair, tf }: { pair: string; tf: Timeframe }) {
  const candles = useMemo(() => getCandles(pair, tf, 80), [pair, tf]);
  const W = 1000;
  const H = 360;
  const padX = 12;
  const padY = 20;

  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;

  const cw = (W - padX * 2) / candles.length;
  const bodyW = Math.max(2, cw * 0.65);

  const y = (v: number) => padY + ((max - v) / span) * (H - padY * 2);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const change = ((last.c - first.o) / first.o) * 100;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold">{pair}</span>
          <span className="font-mono text-lg">{last.c.toFixed(2)}</span>
          <span className={`font-mono text-xs ${change >= 0 ? "text-bull" : "text-bear"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{tf}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-[360px] w-full">
        {/* grid */}
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={padX} x2={W - padX} y1={padY + (H - padY * 2) * p} y2={padY + (H - padY * 2) * p}
            stroke="var(--color-border)" strokeDasharray="2 4" />
        ))}
        {candles.map((c, i) => {
          const x = padX + i * cw + (cw - bodyW) / 2;
          const up = c.c >= c.o;
          const color = up ? "var(--color-bull)" : "var(--color-bear)";
          const bodyY = y(Math.max(c.o, c.c));
          const bodyH = Math.max(1, Math.abs(y(c.o) - y(c.c)));
          const wickX = x + bodyW / 2;
          return (
            <g key={i}>
              <line x1={wickX} x2={wickX} y1={y(c.h)} y2={y(c.l)} stroke={color} strokeWidth={1} />
              <rect x={x} y={bodyY} width={bodyW} height={bodyH} fill={color} />
            </g>
          );
        })}
        {/* price label */}
        <g>
          <line x1={padX} x2={W - padX} y1={y(last.c)} y2={y(last.c)} stroke="var(--color-primary)" strokeDasharray="3 3" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}

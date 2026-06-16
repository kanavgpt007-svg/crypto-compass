import type { Candle, Timeframe } from "@/lib/api";

export function PriceChart({
  pair,
  tf,
  candles,
}: {
  pair: string;
  tf: Timeframe;
  candles: Candle[];
}) {
  const W = 1000;
  const H = 360;
  const padX = 12;
  const padY = 20;

  if (!candles || candles.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-surface text-sm text-muted-foreground">
        No chart data available.
      </div>
    );
  }

  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;

  const cw = (W - padX * 2) / candles.length;
  const bodyW = Math.max(2, cw * 0.65);
  const y = (v: number) => padY + ((max - v) / span) * (H - padY * 2);

  const last = candles[candles.length - 1];
  const first = candles[0];
  const change = ((last.close - first.open) / first.open) * 100;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold">{pair}</span>
          <span className="font-mono text-lg">{last.close.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
          <span className={`font-mono text-xs ${change >= 0 ? "text-bull" : "text-bear"}`}>
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{tf}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-[360px] w-full">
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={padX} x2={W - padX} y1={padY + (H - padY * 2) * p} y2={padY + (H - padY * 2) * p}
            stroke="var(--color-border)" strokeDasharray="2 4" />
        ))}
        {candles.map((c, i) => {
          const x = padX + i * cw + (cw - bodyW) / 2;
          const up = c.close >= c.open;
          const color = up ? "var(--color-bull)" : "var(--color-bear)";
          const bodyY = y(Math.max(c.open, c.close));
          const bodyH = Math.max(1, Math.abs(y(c.open) - y(c.close)));
          const wickX = x + bodyW / 2;
          return (
            <g key={i}>
              <line x1={wickX} x2={wickX} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
              <rect x={x} y={bodyY} width={bodyW} height={bodyH} fill={color} />
            </g>
          );
        })}
        <line x1={padX} x2={W - padX} y1={y(last.close)} y2={y(last.close)} stroke="var(--color-primary)" strokeDasharray="3 3" opacity="0.6" />
      </svg>
    </div>
  );
}

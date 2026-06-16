export function SignalGauge({ score, label }: { score: number; label: string }) {
  const pct = Math.max(0, Math.min(100, (score + 1) * 50));
  const color =
    score > 0.15 ? "var(--color-bull)" : score < -0.15 ? "var(--color-bear)" : "var(--color-neutral)";

  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
        <div
          className="absolute inset-y-0 rounded-full transition-all"
          style={{
            left: score >= 0 ? "50%" : `${pct}%`,
            width: `${Math.abs(pct - 50)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Strong Sell</span>
        <span style={{ color }}>{label.replace(/_/g, " ")}</span>
        <span>Strong Buy</span>
      </div>
    </div>
  );
}

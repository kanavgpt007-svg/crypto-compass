import type { Signal } from "@/lib/analysis-data";

const styles: Record<Signal, string> = {
  STRONG_BUY: "bg-bull/20 text-bull border-bull/30",
  BUY: "bg-bull/10 text-bull border-bull/20",
  NEUTRAL: "bg-muted text-muted-foreground border-border",
  SELL: "bg-bear/10 text-bear border-bear/20",
  STRONG_SELL: "bg-bear/20 text-bear border-bear/30",
};
const labels: Record<Signal, string> = {
  STRONG_BUY: "Strong Buy",
  BUY: "Buy",
  NEUTRAL: "Neutral",
  SELL: "Sell",
  STRONG_SELL: "Strong Sell",
};

export function SignalBadge({ signal, size = "sm" }: { signal: Signal; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium uppercase tracking-wider ${styles[signal]} ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
    >
      {labels[signal]}
    </span>
  );
}

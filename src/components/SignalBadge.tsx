export type SignalKey = "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";

function normalize(s: string): SignalKey {
  const k = s.toUpperCase().replace(/\s+/g, "_");
  if (k === "STRONG_BUY" || k === "BUY" || k === "NEUTRAL" || k === "SELL" || k === "STRONG_SELL") return k;
  return "NEUTRAL";
}

const styles: Record<SignalKey, string> = {
  STRONG_BUY: "bg-bull/20 text-bull border-bull/30",
  BUY: "bg-bull/10 text-bull border-bull/20",
  NEUTRAL: "bg-muted text-muted-foreground border-border",
  SELL: "bg-bear/10 text-bear border-bear/20",
  STRONG_SELL: "bg-bear/20 text-bear border-bear/30",
};
const labels: Record<SignalKey, string> = {
  STRONG_BUY: "Strong Buy",
  BUY: "Buy",
  NEUTRAL: "Neutral",
  SELL: "Sell",
  STRONG_SELL: "Strong Sell",
};

export function SignalBadge({ signal, size = "sm" }: { signal: string; size?: "sm" | "md" }) {
  const k = normalize(signal);
  return (
    <span
      className={`inline-flex items-center rounded border font-mono font-medium uppercase tracking-wider ${styles[k]} ${
        size === "md" ? "px-2.5 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
    >
      {labels[k]}
    </span>
  );
}

import { cn } from "@/lib/cn";
import type { ScoreTone } from "@/lib/types";

const tones: Record<ScoreTone, string> = {
  orange: "from-[#c46a4a] to-[#3a2a26]",
  blue: "from-[#2f4d78] to-[#232a35]",
  purple: "from-[#5b3a75] to-[#2a2333]",
  green: "from-[#376f40] to-[#222622]",
};

type ScoreBarProps = {
  value: number;
  max?: number;
  market?: number;
  tone?: ScoreTone;
  size?: "md" | "lg";
  className?: string;
};

/**
 * Полоса оценки: ширина заливки пропорциональна баллу,
 * пунктир — среднее по рынку.
 */
export function ScoreBar({ value, max = 10, market, tone = "orange", size = "md", className }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const marketPct = market !== undefined ? (market / max) * 100 : undefined;

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-[15px] bg-white/[0.04]", size === "lg" ? "h-[68px]" : "h-[64px]", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn("absolute inset-y-0 left-0 rounded-[15px] bg-gradient-to-r", tones[tone])}
        style={{ width: `${pct}%` }}
      />
      <div className="relative flex h-full items-center gap-1 px-3">
        <span className={cn("leading-none font-medium", size === "lg" ? "text-[52px]" : "text-[48px]")}>
          {Number.isInteger(value) ? value : value.toFixed(1)}
        </span>
        <span className="self-start pt-3 text-sm text-white/60">/{max}</span>
      </div>
      {marketPct !== undefined && (
        <div className="absolute inset-y-0 flex flex-col items-center" style={{ left: `${marketPct}%` }}>
          <span className="mt-0 size-[7px] -translate-y-[3px] rounded-full bg-white/70" />
          <span className="h-full border-l border-dashed border-white/50" />
        </div>
      )}
    </div>
  );
}

export function ScoreCard({
  label,
  value,
  market,
  tone,
}: {
  label: string;
  value: number;
  market?: number;
  tone?: ScoreTone;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-surface-2 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-base font-semibold">{label}:</span>
        {market !== undefined && <span className="text-[11px] text-white/60">Среднее по рынку</span>}
      </div>
      <ScoreBar value={value} market={market} tone={tone} />
    </div>
  );
}

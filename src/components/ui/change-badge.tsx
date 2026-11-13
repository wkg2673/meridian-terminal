import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent, formatSigned } from "@/lib/format";

interface ChangeBadgeProps {
  change: number;
  changePercent: number;
  showAbsolute?: boolean;
  decimals?: number;
  className?: string;
  size?: "sm" | "md";
  variant?: "soft" | "plain";
}

export function ChangeBadge({
  change,
  changePercent,
  showAbsolute = false,
  decimals = 2,
  className,
  size = "md",
  variant = "soft",
}: ChangeBadgeProps) {
  const up = changePercent > 0;
  const down = changePercent < 0;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1 rounded-md font-medium tabular-nums",
        size === "sm" ? "px-1.5 py-0.5 text-2xs" : "px-2 py-1 text-xs",
        variant === "soft" &&
          (up ? "bg-bullish/10 text-bullish" : down ? "bg-bearish/10 text-bearish" : "bg-foreground/[0.06] text-muted"),
        variant === "plain" && (up ? "text-bullish" : down ? "text-bearish" : "text-muted"),
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{formatPercent(changePercent, decimals, false)}</span>
      {showAbsolute && (
        <span className="opacity-70">({formatSigned(change, decimals)})</span>
      )}
    </span>
  );
}

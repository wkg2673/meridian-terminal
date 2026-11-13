"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import type { PositionMetrics } from "@/hooks/use-portfolio";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const SLICE_COLORS = [
  "hsl(var(--brand))",
  "#a78bfa",
  "#22d3ee",
  "#34d399",
  "#f59e0b",
  "#fb7185",
  "#94a3b8",
];

interface Slice {
  label: string;
  detail: string;
  value: number;
  percent: number;
  color: string;
}

export function AllocationChart({
  positions,
  cash,
  totalValue,
  isLoading,
}: {
  positions: PositionMetrics[];
  cash: number;
  totalValue: number;
  isLoading?: boolean;
}) {
  const slices = useMemo<Slice[]>(() => {
    const ranked = [...positions].sort((a, b) => b.marketValue - a.marketValue);
    const top = ranked.slice(0, 5);
    const rest = ranked.slice(5);
    const total = totalValue || 1;
    const result: Slice[] = top.map((position, index) => ({
      label: position.asset?.symbol ?? position.holding.symbol,
      detail: position.asset?.name ?? "Position",
      value: position.marketValue,
      percent: (position.marketValue / total) * 100,
      color: SLICE_COLORS[index % SLICE_COLORS.length],
    }));

    if (rest.length) {
      const value = rest.reduce((sum, position) => sum + position.marketValue, 0);
      result.push({
        label: "Other",
        detail: `${rest.length} smaller position${rest.length === 1 ? "" : "s"}`,
        value,
        percent: (value / total) * 100,
        color: SLICE_COLORS[5],
      });
    }

    if (cash > 0) {
      result.push({
        label: "Cash",
        detail: "Uninvested balance",
        value: cash,
        percent: (cash / total) * 100,
        color: "hsl(var(--border-strong))",
      });
    }

    return result;
  }, [positions, cash, totalValue]);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-[148px] w-[148px] shrink-0">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Portfolio allocation">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="13" opacity="0.35" />
            {slices.map((slice) => {
              const length = (slice.percent / 100) * circumference;
              const dash = Math.max(length - 2.5, 0);
              const element = (
                <circle
                  key={slice.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += length;
              return element;
            })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tnum text-[17px] font-semibold tracking-tight text-foreground">
              {isLoading ? "—" : formatCompact(totalValue)}
            </span>
            <span className="mt-0.5 text-3xs uppercase tracking-[0.08em] text-subtle">Total value</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5 self-stretch sm:self-center">
          {slices.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-4 text-center sm:items-start sm:text-left">
              <Wallet className="h-4 w-4 text-subtle" />
              <p className="text-2xs text-muted">Add a position to see your allocation.</p>
            </div>
          ) : (
            slices.map((slice) => (
              <div key={slice.label} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-2xs font-medium text-foreground">{slice.label}</span>
                    <span className="tnum shrink-0 text-2xs text-muted">{formatPercent(slice.percent, 1, false)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-3xs text-subtle">{slice.detail}</span>
                    <span className="tnum shrink-0 text-3xs text-subtle">{formatCurrency(slice.value, "USD", true)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-2xs">
        <span className="flex items-center gap-1.5 text-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", positions.length ? "bg-bullish" : "bg-border-strong")} />
          {positions.length} position{positions.length === 1 ? "" : "s"}
        </span>
        <span className="tnum text-subtle">Cash weight {formatPercent((cash / (totalValue || 1)) * 100, 1, false)}</span>
      </div>
    </div>
  );
}

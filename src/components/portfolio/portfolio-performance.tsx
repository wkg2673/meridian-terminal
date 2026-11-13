"use client";

import { useId } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const WIDTH = 640;
const HEIGHT = 180;
const PAD = 8;

export function PortfolioPerformance({
  values,
  isLoading,
}: {
  values: number[];
  isLoading?: boolean;
}) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");

  if (isLoading) {
    return <div className="skeleton h-[180px] w-full rounded-lg" />;
  }

  if (values.length < 2) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-2/30">
        <TrendingUp className="h-5 w-5 text-subtle" />
        <p className="text-xs font-medium text-foreground">No performance history yet</p>
        <p className="text-2xs text-muted">Add a position to start tracking portfolio value.</p>
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const usableHeight = HEIGHT - PAD * 2;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * WIDTH;
    const y = HEIGHT - PAD - ((value - min) / span) * usableHeight;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });

  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const first = values[0];
  const last = values[values.length - 1];
  const positive = last >= first;
  const delta = last - first;
  const deltaPercent = first ? (delta / first) * 100 : 0;
  const color = positive ? "hsl(var(--bullish))" : "hsl(var(--bearish))";
  const lastPoint = points[points.length - 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-2xs text-subtle">Intraday mark-to-market</p>
          <p className="tnum mt-0.5 text-lg font-semibold tracking-tight text-foreground">
            {formatCurrency(last)}
          </p>
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", positive ? "text-bullish" : "text-bearish")}>
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span className="tnum">
            {delta >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(delta))}
          </span>
          <span className="tnum text-2xs opacity-80">({deltaPercent >= 0 ? "+" : "−"}{Math.abs(deltaPercent).toFixed(2)}%)</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-lg border border-border bg-surface-2/20">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="h-[180px] w-full"
          role="img"
          aria-label="Portfolio value over the session"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.24" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={WIDTH}
              y1={HEIGHT * ratio}
              y2={HEIGHT * ratio}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeDasharray="3 5"
              opacity="0.55"
            />
          ))}
          <path d={area} fill={`url(#${gradientId})`} />
          <path
            d={line}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill={color} />
        </svg>
        <div className="pointer-events-none absolute inset-x-2 bottom-1.5 flex justify-between text-3xs text-subtle">
          <span>{formatCurrency(min, "USD", true)} low</span>
          <span>{formatCurrency(max, "USD", true)} high</span>
        </div>
      </div>
    </div>
  );
}

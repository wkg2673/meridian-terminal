"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
  width?: number;
  height?: number;
  positive?: boolean;
  strokeWidth?: number;
  fill?: boolean;
  showEndDot?: boolean;
}

export function Sparkline({
  values,
  className,
  width = 96,
  height = 32,
  positive,
  strokeWidth = 1.5,
  fill = true,
  showEndDot = false,
}: SparklineProps) {
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");
  if (!values || values.length < 2) {
    return (
      <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden>
        <line
          x1="0"
          x2={width}
          y1={height / 2}
          y2={height / 2}
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeDasharray="3 4"
        />
      </svg>
    );
  }

  const isUp = positive ?? values[values.length - 1] >= values[0];
  const color = isUp ? "hsl(var(--bullish))" : "hsl(var(--bearish))";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = strokeWidth + 1;
  const usableHeight = height - pad * 2;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - pad - ((value - min) / span) * usableHeight;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });

  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showEndDot && <circle cx={last[0]} cy={last[1]} r={2} fill={color} />}
    </svg>
  );
}

import type { Asset } from "@/lib/market/types";

const formatterCache = new Map<string, Intl.NumberFormat>();

function nf(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

export function priceDecimals(asset: Asset | undefined, value: number): number {
  if (asset?.class === "forex") {
    return asset.symbol.includes("JPY") ? 3 : 5;
  }
  if (asset?.class === "crypto") {
    if (value >= 10) return 2;
    if (value >= 1) return 3;
    if (value >= 0.01) return 4;
    return 6;
  }
  if (asset?.class === "commodity") {
    return value >= 100 ? 2 : 3;
  }
  if (value >= 1000) return 2;
  if (value >= 1) return 2;
  if (value >= 0.01) return 4;
  return 5;
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatPrice(value: number, asset?: Asset, opts?: { decimals?: number }): string {
  if (!Number.isFinite(value)) return "—";
  const decimals = opts?.decimals ?? priceDecimals(asset, value);
  return nf({ minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatSigned(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  const formatted = nf({
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "exceptZero",
  }).format(value);
  return formatted;
}

export function formatPercent(value: number, decimals = 2, withSign = true): string {
  if (!Number.isFinite(value)) return "—";
  return `${withSign ? formatSigned(value, decimals) : formatNumber(value, decimals)}%`;
}

export function formatCompact(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "—";
  return nf({
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency = "USD", compact = false): string {
  if (!Number.isFinite(value)) return "—";
  return nf({
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 2 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(value);
}

export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const decimals = Number.isInteger(value) ? 0 : value < 1 ? 6 : 4;
  return nf({ maximumFractionDigits: decimals }).format(value);
}

export function formatTimeAgo(timestamp: number | undefined, now = Date.now()): string {
  if (!timestamp) return "—";
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatClock(timestamp: number | undefined): string {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatDateLabel(timestampSeconds: number, intraday = false): string {
  const date = new Date(timestampSeconds * 1000);
  if (intraday) {
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toneClass(value: number): string {
  if (value > 0) return "text-bullish";
  if (value < 0) return "text-bearish";
  return "text-muted";
}

export function changeTone(value: number): "up" | "down" | "flat" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

export function smartPrice(value: number): string {
  return formatPrice(value);
}

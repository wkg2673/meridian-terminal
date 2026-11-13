import type { Asset, Candle, Quote, Timeframe } from "./types";
import { getTimeframe } from "./types";
import { DAY_MS, demoCandleSeries, demoPriceAt, demoSparkline } from "./simulation";

export const DEMO_PROVIDER = "Meridian Simulation";

export { DAY_MS, demoPriceAt, hash01, hashString, valueNoise } from "./simulation";

export function getDemoCandles(
  asset: Asset,
  timeframe: Timeframe,
  limit = 480,
  nowMs = Date.now(),
): Candle[] {
  return demoCandleSeries(asset, timeframe, limit, nowMs, getTimeframe);
}

export function getDemoQuote(asset: Asset, nowMs = Date.now()): Quote {
  const candles = getDemoCandles(asset, "1D", 3, nowMs);
  const current = candles[candles.length - 1];
  const previous = candles[candles.length - 2] ?? current;
  const price = demoPriceAt(asset, nowMs, nowMs);
  const prevClose = previous.close;
  const change = price - prevClose;
  const dayStart = Math.floor(nowMs / DAY_MS) * DAY_MS;
  const progress = Math.min(Math.max((nowMs - dayStart) / DAY_MS, 0.02), 1);

  return {
    symbol: asset.symbol,
    price,
    change,
    changePercent: prevClose === 0 ? 0 : (change / prevClose) * 100,
    open: current.open,
    high: Math.max(current.high, current.open, price),
    low: Math.min(current.low, current.open, price),
    prevClose,
    volume: Math.round(current.volume * progress),
    timestamp: nowMs,
    source: "demo",
    provider: DEMO_PROVIDER,
    currency: asset.currency,
    marketCap: asset.marketCap,
    note: "Simulated market data generated locally for demonstration.",
  };
}

export function getDemoSparkline(asset: Asset, points: number, nowMs = Date.now()): number[] {
  return demoSparkline(asset, points, nowMs);
}

export function getDemoQuotes(assets: Asset[], nowMs = Date.now()): Quote[] {
  return assets.map((asset) => getDemoQuote(asset, nowMs));
}

export function getDemoSparklines(
  assets: Asset[],
  points = 40,
  nowMs = Date.now(),
): Record<string, number[]> {
  return Object.fromEntries(
    assets.map((asset) => [asset.id, demoSparkline(asset, points, nowMs)]),
  );
}

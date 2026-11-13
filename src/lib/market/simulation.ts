import type { Asset, Candle, Timeframe, TimeframeMeta } from "./types";

export const DAY_MS = 86_400_000;

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function hash01(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth 1D value noise in [-1, 1]. */
export function valueNoise(seed: number, x: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  const a = hash01(seed + i * 127.1);
  const b = hash01(seed + (i + 1) * 127.1);
  return (a + (b - a) * u) * 2 - 1;
}

function logPath(asset: Asset, tDays: number): number {
  const seed = hashString(asset.id);
  const v = asset.volatility;

  return (
    asset.drift * tDays +
    12 * v * valueNoise(seed + 11, tDays / 380) +
    6 * v * valueNoise(seed + 29, tDays / 64) +
    2.4 * v * valueNoise(seed + 47, tDays / 9.5) +
    0.72 * v * valueNoise(seed + 61, tDays / 1.35) +
    0.22 * v * valueNoise(seed + 79, tDays / 0.16) +
    0.05 * v * valueNoise(seed + 97, tDays / 0.006) +
    0.012 * v * valueNoise(seed + 131, tDays / 0.0015)
  );
}

/**
 * Deterministic price at an absolute moment. The path is normalised against
 * `nowMs`, keeping the latest print anchored to the instrument's base price.
 */
export function demoPriceAt(asset: Asset, timeMs: number, nowMs: number = Date.now()): number {
  const nowDays = nowMs / DAY_MS;
  const tDays = timeMs / DAY_MS;
  const base = Math.log(asset.basePrice) + logPath(asset, tDays) - logPath(asset, nowDays);
  const tick = 1 + asset.volatility * 0.012 * valueNoise(hashString(asset.id) + 331, nowMs / 7000);
  return Math.exp(base) * tick;
}

function barVolume(asset: Asset, timeframe: TimeframeMeta, barStartSec: number, bucketSec: number): number {
  const dayFraction = Math.min(bucketSec / 86_400, 30);
  const seed = hashString(`${asset.id}:${timeframe.id}:vol`);
  const hour = new Date(barStartSec * 1000).getUTCHours();
  // Mild U-shaped intraday liquidity profile.
  const intraday = 0.72 + 0.5 * Math.exp(-Math.pow(hour - 14, 2) / 18) + 0.22 * hash01(seed + barStartSec / bucketSec);
  return asset.avgVolume * dayFraction * intraday * (0.55 + 0.9 * hash01(seed + barStartSec / 97));
}

export function demoCandleSeries(
  asset: Asset,
  timeframe: Timeframe,
  limit: number,
  nowMs: number,
  getTimeframe: (id: Timeframe) => TimeframeMeta,
): Candle[] {
  const meta = getTimeframe(timeframe);
  const bucket = meta.seconds;
  const nowSec = Math.floor(nowMs / 1000);
  const lastStart = Math.floor(nowSec / bucket) * bucket;
  const firstStart = lastStart - (limit - 1) * bucket;
  const out: Candle[] = [];

  let previousClose = demoPriceAt(asset, firstStart * 1000, nowMs);

  for (let i = 0; i < limit; i += 1) {
    const barStart = firstStart + i * bucket;
    const barEnd = Math.min(barStart + bucket, nowSec);
    const open = previousClose;
    const close = demoPriceAt(asset, Math.max(barEnd, barStart) * 1000, nowMs);

    let high = Math.max(open, close);
    let low = Math.min(open, close);
    const samples = bucket >= 86_400 ? 14 : bucket >= 3600 ? 6 : 4;
    for (let s = 1; s <= samples; s += 1) {
      const t = barStart + ((barEnd - barStart) * s) / (samples + 1);
      const p = demoPriceAt(asset, t * 1000, nowMs);
      if (p > high) high = p;
      if (p < low) low = p;
    }

    // Add a small deterministic wick so even quiet bars read naturally.
    const unit = Math.sqrt(Math.min(bucket / 86_400, 30));
    const wickSeed = hashString(`${asset.id}:${timeframe}`) + i * 37;
    const wick = Math.max(open, close) * asset.volatility * unit * (0.06 + 0.22 * hash01(wickSeed));
    high = Math.max(high, Math.max(open, close) + wick);
    low = Math.min(low, Math.min(open, close) - wick * 0.92);

    out.push({
      time: barStart,
      open: Number(open.toFixed(10)),
      high: Number(high.toFixed(10)),
      low: Number(low.toFixed(10)),
      close: Number(close.toFixed(10)),
      volume: Math.round(barVolume(asset, meta, barStart, bucket)),
    });
    previousClose = close;
  }

  // Guard against any duplicate timestamps.
  return out.filter((bar, index) => index === 0 || bar.time > out[index - 1].time);
}

export function demoSparkline(asset: Asset, points: number, nowMs: number): number[] {
  const safePoints = Math.max(8, points);
  const span = DAY_MS;
  const close = demoPriceAt(asset, nowMs);
  const values: number[] = [];
  for (let i = 0; i < safePoints; i += 1) {
    const t = nowMs - span + (span * i) / (safePoints - 1);
    values.push(Number(demoPriceAt(asset, t, nowMs).toFixed(8)));
  }
  values[values.length - 1] = close;
  return values;
}

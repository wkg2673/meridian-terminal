import type { Candle } from "@/lib/market/types";

export interface LinePoint {
  time: number;
  value: number;
}

function toLine(candles: Candle[], values: Array<number | null>): LinePoint[] {
  const result: LinePoint[] = [];
  for (let index = 0; index < candles.length; index += 1) {
    const value = values[index];
    if (value !== null && Number.isFinite(value)) {
      result.push({ time: candles[index].time, value });
    }
  }
  return result;
}

export function sma(candles: Candle[], period: number): LinePoint[] {
  const safePeriod = Math.max(1, Math.floor(period));
  const values: Array<number | null> = new Array(candles.length).fill(null);
  let sum = 0;
  for (let index = 0; index < candles.length; index += 1) {
    sum += candles[index].close;
    if (index >= safePeriod) sum -= candles[index - safePeriod].close;
    if (index >= safePeriod - 1) values[index] = sum / safePeriod;
  }
  return toLine(candles, values);
}

export function ema(candles: Candle[], period: number): LinePoint[] {
  const safePeriod = Math.max(1, Math.floor(period));
  const values: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < safePeriod) return [];
  const multiplier = 2 / (safePeriod + 1);
  let previous = candles.slice(0, safePeriod).reduce((sum, candle) => sum + candle.close, 0) / safePeriod;
  values[safePeriod - 1] = previous;
  for (let index = safePeriod; index < candles.length; index += 1) {
    previous = (candles[index].close - previous) * multiplier + previous;
    values[index] = previous;
  }
  return toLine(candles, values);
}

export function standardDeviation(values: number[], mean: number): number {
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function bollingerBands(candles: Candle[], period: number, multiplier: number) {
  const safePeriod = Math.max(2, Math.floor(period));
  const middle: Array<number | null> = new Array(candles.length).fill(null);
  const upper: Array<number | null> = new Array(candles.length).fill(null);
  const lower: Array<number | null> = new Array(candles.length).fill(null);

  for (let index = safePeriod - 1; index < candles.length; index += 1) {
    const window = candles.slice(index - safePeriod + 1, index + 1).map((candle) => candle.close);
    const mean = window.reduce((sum, value) => sum + value, 0) / safePeriod;
    const deviation = standardDeviation(window, mean);
    middle[index] = mean;
    upper[index] = mean + deviation * multiplier;
    lower[index] = mean - deviation * multiplier;
  }

  return {
    middle: toLine(candles, middle),
    upper: toLine(candles, upper),
    lower: toLine(candles, lower),
  };
}

export function rsi(candles: Candle[], period = 14): LinePoint[] {
  const safePeriod = Math.max(2, Math.floor(period));
  const values: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length <= safePeriod) return [];

  let gain = 0;
  let loss = 0;
  for (let index = 1; index <= safePeriod; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    if (change >= 0) gain += change;
    else loss -= change;
  }
  gain /= safePeriod;
  loss /= safePeriod;
  values[safePeriod] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);

  for (let index = safePeriod + 1; index < candles.length; index += 1) {
    const change = candles[index].close - candles[index - 1].close;
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;
    gain = (gain * (safePeriod - 1) + currentGain) / safePeriod;
    loss = (loss * (safePeriod - 1) + currentLoss) / safePeriod;
    values[index] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }

  return toLine(candles, values);
}

export interface MacdResult {
  macd: LinePoint[];
  signal: LinePoint[];
  histogram: Array<LinePoint & { positive: boolean }>;
}

export function macd(candles: Candle[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  const fastPeriod = Math.max(2, Math.floor(fast));
  const slowPeriod = Math.max(fastPeriod + 1, Math.floor(slow));
  const signalLength = Math.max(2, Math.floor(signalPeriod));

  const fastValues = emaSeries(candles, fastPeriod);
  const slowValues = emaSeries(candles, slowPeriod);
  const macdValues: Array<number | null> = new Array(candles.length).fill(null);

  for (let index = 0; index < candles.length; index += 1) {
    const fastValue = fastValues[index];
    const slowValue = slowValues[index];
    if (fastValue !== null && slowValue !== null) macdValues[index] = fastValue - slowValue;
  }

  const signalValues: Array<number | null> = new Array(candles.length).fill(null);
  const firstIndex = macdValues.findIndex((value) => value !== null);
  if (firstIndex >= 0) {
    const available = macdValues.slice(firstIndex) as number[];
    const multiplier = 2 / (signalLength + 1);
    let seedIndex = 0;
    let sum = 0;
    while (seedIndex < signalLength && seedIndex < available.length) {
      sum += available[seedIndex];
      seedIndex += 1;
    }
    if (seedIndex === signalLength) {
      let previous = sum / signalLength;
      signalValues[firstIndex + signalLength - 1] = previous;
      for (let offset = signalLength; offset < available.length; offset += 1) {
        previous = (available[offset] - previous) * multiplier + previous;
        signalValues[firstIndex + offset] = previous;
      }
    }
  }

  const macdLine = toLine(candles, macdValues);
  const signalLine = toLine(candles, signalValues);
  const histogram: MacdResult["histogram"] = [];
  for (let index = 0; index < candles.length; index += 1) {
    const macdValue = macdValues[index];
    const signalValue = signalValues[index];
    if (macdValue !== null && signalValue !== null) {
      const value = macdValue - signalValue;
      histogram.push({ time: candles[index].time, value, positive: value >= 0 });
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

function emaSeries(candles: Candle[], period: number): Array<number | null> {
  const values: Array<number | null> = new Array(candles.length).fill(null);
  if (candles.length < period) return values;
  const multiplier = 2 / (period + 1);
  let previous = candles.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
  values[period - 1] = previous;
  for (let index = period; index < candles.length; index += 1) {
    previous = (candles[index].close - previous) * multiplier + previous;
    values[index] = previous;
  }
  return values;
}

export function lastValue(points: LinePoint[]): number | undefined {
  return points.length ? points[points.length - 1].value : undefined;
}

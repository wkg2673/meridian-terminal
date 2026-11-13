import type { Asset, Candle, MarketDataProvider, Quote, Timeframe } from "../types";
import { getTimeframe } from "../types";
import { fetchJson, toNumber, toTimestampSeconds } from "./http";

type TwelveQuote = {
  symbol?: string;
  name?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
  is_market_open?: boolean;
  status?: string;
  message?: string;
};

type TwelveSeries = {
  meta?: { currency?: string; exchange?: string };
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>;
  status?: string;
  message?: string;
};

function key(): string {
  return process.env.TWELVE_DATA_API_KEY?.trim() ?? "";
}

function symbolFor(asset: Asset): string {
  return asset.providerIds?.twelveData ?? asset.symbol;
}

function parseDate(datetime: string): number | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(datetime)) {
    return Math.floor(Date.parse(`${datetime}T00:00:00Z`) / 1000);
  }
  const normalized = datetime.includes("T") ? datetime : datetime.replace(" ", "T");
  const withZone = /Z$|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;
  const parsed = Date.parse(withZone);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
}

async function quote(asset: Asset): Promise<Quote> {
  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", symbolFor(asset));
  url.searchParams.set("apikey", key());

  const data = await fetchJson<TwelveQuote>(url.toString());
  const price = toNumber(data.close);
  if (!price) {
    throw new Error(data.message ?? "Twelve Data returned no price");
  }
  const previous = toNumber(data.previous_close, price);
  const change = toNumber(data.change, price - previous);
  return {
    symbol: asset.symbol,
    price,
    change,
    changePercent: toNumber(data.percent_change, previous ? (change / previous) * 100 : 0),
    open: toNumber(data.open, price),
    high: toNumber(data.high, price),
    low: toNumber(data.low, price),
    prevClose: previous,
    volume: toNumber(data.volume),
    timestamp: (toTimestampSeconds(data.timestamp) ?? Math.floor(Date.now() / 1000)) * 1000,
    source: "delayed",
    provider: "Twelve Data",
    currency: data.currency ?? asset.currency,
    note: "Provider quotes may be delayed depending on your Twelve Data plan.",
  };
}

async function candles(asset: Asset, timeframe: Timeframe, limit: number): Promise<Candle[]> {
  const meta = getTimeframe(timeframe);
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", symbolFor(asset));
  url.searchParams.set("interval", meta.twelveData);
  url.searchParams.set("outputsize", String(Math.min(Math.max(limit, 30), 5000)));
  url.searchParams.set("order", "ASC");
  url.searchParams.set("apikey", key());

  const data = await fetchJson<TwelveSeries>(url.toString());
  if (!data.values?.length) {
    throw new Error(data.message ?? "Twelve Data returned no candles");
  }

  return data.values
    .map((row) => {
      const time = parseDate(row.datetime);
      if (!time) return null;
      return {
        time,
        open: toNumber(row.open),
        high: toNumber(row.high),
        low: toNumber(row.low),
        close: toNumber(row.close),
        volume: toNumber(row.volume),
      } satisfies Candle;
    })
    .filter((bar): bar is Candle => bar !== null && bar.close > 0);
}

export const twelveDataProvider: MarketDataProvider = {
  id: "twelve-data",
  label: "Twelve Data",
  supports: (asset) => Boolean(key() && asset.providerIds?.twelveData),
  getQuotes: async (assets) => Promise.all(assets.map(quote)),
  getCandles: candles,
};

export function twelveDataConfigured(): boolean {
  return Boolean(key());
}

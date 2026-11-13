import type { Asset, Candle, MarketDataProvider, Quote, Timeframe } from "../types";
import { getTimeframe } from "../types";
import { fetchJson, toNumber, toTimestampSeconds } from "./http";

type FinnhubQuote = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubCandles = {
  s?: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
  error?: string;
};

function key(): string {
  return process.env.FINNHUB_API_KEY?.trim() ?? "";
}

function symbolFor(asset: Asset): string {
  return asset.providerIds?.finnhub ?? asset.symbol;
}

async function quote(asset: Asset): Promise<Quote> {
  const url = new URL("https://finnhub.io/api/v1/quote");
  url.searchParams.set("symbol", symbolFor(asset));
  url.searchParams.set("token", key());

  const data = await fetchJson<FinnhubQuote>(url.toString());
  const price = toNumber(data.c);
  if (!price) throw new Error("Finnhub returned no price");

  return {
    symbol: asset.symbol,
    price,
    change: toNumber(data.d, price - toNumber(data.pc, price)),
    changePercent: toNumber(data.dp),
    open: toNumber(data.o, price),
    high: toNumber(data.h, price),
    low: toNumber(data.l, price),
    prevClose: toNumber(data.pc, price),
    volume: 0,
    timestamp: (toTimestampSeconds(data.t) ?? Math.floor(Date.now() / 1000)) * 1000,
    source: "delayed",
    provider: "Finnhub",
    currency: asset.currency,
    note: "Finnhub real-time availability depends on your exchange and plan.",
  };
}

async function candles(asset: Asset, timeframe: Timeframe, limit: number): Promise<Candle[]> {
  if (asset.class !== "crypto") {
    throw new Error("Finnhub candle history requires a paid market-data plan");
  }

  const meta = getTimeframe(timeframe);
  const resolution = timeToResolution(timeframe);
  const to = Math.floor(Date.now() / 1000);
  const from = to - meta.seconds * Math.min(limit * 2, 5000);
  const symbol = asset.providerIds?.finnhub ?? `BINANCE:${asset.id.replace("USD", "USDT")}`;

  const url = new URL("https://finnhub.io/api/v1/crypto/candle");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("resolution", resolution);
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  url.searchParams.set("token", key());

  const data = await fetchJson<FinnhubCandles>(url.toString());
  if (data.s !== "ok" || !data.t?.length) {
    throw new Error(data.error ?? "Finnhub returned no candles");
  }

  return data.t
    .map((time, index) => ({
      time,
      open: data.o?.[index] ?? 0,
      high: data.h?.[index] ?? 0,
      low: data.l?.[index] ?? 0,
      close: data.c?.[index] ?? 0,
      volume: data.v?.[index] ?? 0,
    }))
    .filter((bar) => bar.close > 0);
}

function timeToResolution(timeframe: Timeframe): string {
  switch (timeframe) {
    case "1m":
      return "1";
    case "5m":
      return "5";
    case "15m":
      return "15";
    case "30m":
      return "30";
    case "1H":
      return "60";
    case "4H":
      return "240";
    case "1D":
      return "D";
    case "1W":
      return "W";
    case "1M":
      return "M";
    default:
      return "D";
  }
}

export const finnhubProvider: MarketDataProvider = {
  id: "finnhub",
  label: "Finnhub",
  supports: (asset) => Boolean(key() && asset.providerIds?.finnhub),
  getQuotes: async (assets) => Promise.all(assets.map(quote)),
  getCandles: candles,
};

export function finnhubConfigured(): boolean {
  return Boolean(key());
}

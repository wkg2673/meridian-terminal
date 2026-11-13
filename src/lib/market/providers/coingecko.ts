import type { Asset, Candle, MarketDataProvider, Quote, Timeframe } from "../types";
import { fetchJson, toNumber } from "./http";

type SimplePrice = Record<
  string,
  {
    usd?: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
    last_updated_at?: number;
  }
>;

type MarketChart = {
  prices?: Array<[number, number]>;
  total_volumes?: Array<[number, number]>;
};

type OhlcPoint = [number, number, number, number, number];

function key(): string {
  return process.env.COINGECKO_API_KEY?.trim() ?? "";
}

function headers(): HeadersInit {
  // Demo keys use x-cg-demo-api-key; pro keys use x-cg-pro-api-key.
  return { "x-cg-demo-api-key": key(), accept: "application/json" };
}

function coinId(asset: Asset): string | undefined {
  return asset.providerIds?.coinGecko;
}

function daysFor(timeframe: Timeframe): string {
  switch (timeframe) {
    case "1m":
    case "5m":
    case "15m":
    case "30m":
    case "1H":
      return "1";
    case "4H":
      return "7";
    case "1D":
      return "30";
    case "1W":
      return "180";
    case "1M":
      return "365";
    default:
      return "30";
  }
}

async function quotes(assets: Asset[]): Promise<Quote[]> {
  const valid = assets.filter((asset) => coinId(asset));
  if (!valid.length) return [];

  const ids = [...new Set(valid.map((asset) => coinId(asset)!))].join(",");
  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", ids);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");
  url.searchParams.set("include_24hr_vol", "true");
  url.searchParams.set("include_market_cap", "true");
  url.searchParams.set("include_last_updated_at", "true");

  const simple = await fetchJson<SimplePrice>(url.toString(), { headers: headers() });

  const results = await Promise.allSettled(
    valid.map(async (asset) => {
      const id = coinId(asset)!;
      const entry = simple[id];
      if (!entry?.usd) throw new Error(`CoinGecko returned no price for ${asset.symbol}`);

      let high = entry.usd;
      let low = entry.usd;
      let open = entry.usd;
      let volume = entry.usd_24h_vol ?? 0;

      try {
        const chartUrl = new URL(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`);
        chartUrl.searchParams.set("vs_currency", "usd");
        chartUrl.searchParams.set("days", "1");
        const chart = await fetchJson<MarketChart>(chartUrl.toString(), { headers: headers() });
        const prices = (chart.prices ?? []).map((point) => point[1]).filter((value) => value > 0);
        if (prices.length) {
          high = Math.max(...prices);
          low = Math.min(...prices);
          open = prices[0];
        }
        const lastVolume = chart.total_volumes?.[chart.total_volumes.length - 1]?.[1];
        if (lastVolume) volume = lastVolume;
      } catch {
        // Stats are best-effort; pricing still succeeds without them.
      }

      const price = entry.usd!;
      const changePercent = toNumber(entry.usd_24h_change);
      const prevClose = price / (1 + changePercent / 100);
      const change = price - prevClose;

      return {
        symbol: asset.symbol,
        price,
        change,
        changePercent,
        open,
        high: Math.max(high, price),
        low: Math.min(low, price),
        prevClose,
        volume,
        timestamp: (entry.last_updated_at ?? Math.floor(Date.now() / 1000)) * 1000,
        source: "delayed",
        provider: "CoinGecko",
        currency: "USD",
        marketCap: entry.usd_market_cap,
        note: "CoinGecko aggregate prices may lag the most granular exchange feeds.",
      } satisfies Quote;
    }),
  );

  return results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
}

async function candles(asset: Asset, timeframe: Timeframe, limit: number): Promise<Candle[]> {
  const id = coinId(asset);
  if (!id) throw new Error("No CoinGecko id configured for this asset");

  const days = daysFor(timeframe);
  const ohlcUrl = new URL(`https://api.coingecko.com/api/v3/coins/${id}/ohlc`);
  ohlcUrl.searchParams.set("vs_currency", "usd");
  ohlcUrl.searchParams.set("days", days);
  ohlcUrl.searchParams.set("precision", "full");

  const [ohlc, chart] = await Promise.all([
    fetchJson<OhlcPoint[]>(ohlcUrl.toString(), { headers: headers() }),
    fetchJson<MarketChart>(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}&precision=full`,
      { headers: headers() },
    ).catch(() => ({}) as MarketChart),
  ]);

  if (!Array.isArray(ohlc) || !ohlc.length) {
    throw new Error("CoinGecko returned no candles");
  }

  const volumeByBucket = new Map<number, number>();
  for (const [ms, volume] of chart.total_volumes ?? []) {
    volumeByBucket.set(Math.floor(ms / 1000), volume);
  }
  const chartTimes = [...volumeByBucket.keys()].sort((a, b) => a - b);

  const bars = ohlc.slice(-limit).map(([ms, open, high, low, close]) => {
    const time = Math.floor(ms / 1000);
    let nearest = chartTimes.length ? chartTimes[0] : 0;
    for (const candidate of chartTimes) {
      if (Math.abs(candidate - time) < Math.abs(nearest - time)) nearest = candidate;
    }
    return { time, open, high, low, close, volume: volumeByBucket.get(nearest) ?? 0 } satisfies Candle;
  });

  return bars;
}

export const coinGeckoProvider: MarketDataProvider = {
  id: "coingecko",
  label: "CoinGecko",
  supports: (asset) => Boolean(key() && asset.class === "crypto" && asset.providerIds?.coinGecko),
  getQuotes: quotes,
  getCandles: candles,
};

export function coinGeckoConfigured(): boolean {
  return Boolean(key());
}

import { getDemoCandles, getDemoQuote, getDemoSparkline } from "./demo";
import type {
  Asset,
  Candle,
  CandleResult,
  DataSourceKind,
  MarketDataProvider,
  ProviderStatus,
  Quote,
  SparklineResult,
  Timeframe,
} from "./types";
import { coinGeckoConfigured, coinGeckoProvider } from "./providers/coingecko";
import { finnhubConfigured, finnhubProvider } from "./providers/finnhub";
import { twelveDataConfigured, twelveDataProvider } from "./providers/twelve-data";

const QUOTE_TTL_MS = 6_000;
const CANDLE_TTL_MS = 60_000;
const SPARK_TTL_MS = 60_000;

type CacheEntry = { expires: number; value: unknown };
const cache = new Map<string, CacheEntry>();

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await load();
  cache.set(key, { expires: Date.now() + ttl, value });
  if (cache.size > 500) {
    const now = Date.now();
    for (const [entryKey, entry] of cache) {
      if (entry.expires < now) cache.delete(entryKey);
    }
  }
  return value;
}

function demoForced(): boolean {
  return process.env.MARKET_DATA_MODE === "demo";
}

function providersFor(asset: Asset): MarketDataProvider[] {
  if (demoForced()) return [];
  const providers: MarketDataProvider[] = [];
  if (asset.class === "crypto" && coinGeckoProvider.supports(asset)) providers.push(coinGeckoProvider);
  if (twelveDataProvider.supports(asset)) providers.push(twelveDataProvider);
  if (finnhubProvider.supports(asset)) providers.push(finnhubProvider);
  return providers;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message.slice(0, 140);
  return "unknown provider error";
}

export async function resolveQuote(asset: Asset): Promise<Quote> {
  return cached(`quote:${asset.id}`, QUOTE_TTL_MS, async () => {
    for (const provider of providersFor(asset)) {
      try {
        const quotes = await provider.getQuotes([asset]);
        if (quotes[0]) return quotes[0];
      } catch {
        // Try the next provider, then fall back to simulation.
      }
    }
    return getDemoQuote(asset);
  });
}

export async function resolveQuotes(assets: Asset[]): Promise<Quote[]> {
  const unique = [...new Map(assets.map((asset) => [asset.id, asset])).values()];
  return Promise.all(unique.map((asset) => resolveQuote(asset)));
}

export async function resolveCandles(
  asset: Asset,
  timeframe: Timeframe,
  limit = 480,
): Promise<CandleResult> {
  const safeLimit = Math.min(Math.max(limit, 40), 1500);
  return cached(`candles:${asset.id}:${timeframe}:${safeLimit}`, CANDLE_TTL_MS, async () => {
    for (const provider of providersFor(asset)) {
      try {
        const candles = await provider.getCandles(asset, timeframe, safeLimit);
        if (candles.length > 5) {
          return {
            symbol: asset.symbol,
            timeframe,
            candles: dedupeCandles(candles).slice(-safeLimit),
            source: "delayed" as const,
            provider: provider.label,
            note: "Historical candles are provided by your configured market-data provider and may be delayed.",
            timestamp: Date.now(),
          };
        }
      } catch {
        // Fall through to demo.
      }
    }

    return {
      symbol: asset.symbol,
      timeframe,
      candles: getDemoCandles(asset, timeframe, safeLimit),
      source: "demo" as const,
      provider: "Meridian Simulation",
      note: providersFor(asset).length
        ? `Candle history from ${providersFor(asset).map((p) => p.label).join(" / ")} is unavailable on the current plan. Showing demonstration data.`
        : "Demonstration candles generated locally. Configure a market-data provider for live history.",
      timestamp: Date.now(),
    };
  });
}

function dedupeCandles(candles: Candle[]): Candle[] {
  const map = new Map<number, Candle>();
  for (const candle of candles) {
    if (Number.isFinite(candle.time) && candle.close > 0) map.set(candle.time, candle);
  }
  return [...map.values()].sort((a, b) => a.time - b.time);
}

export async function resolveSparklines(assets: Asset[], points = 36): Promise<SparklineResult> {
  return cached(`spark:${assets.map((a) => a.id).join(",")}:${points}`, SPARK_TTL_MS, async () => {
    let source: DataSourceKind = "demo";
    const values: Record<string, number[]> = {};

    await Promise.all(
      assets.map(async (asset) => {
        for (const provider of providersFor(asset)) {
          try {
            const candles = await provider.getCandles(asset, "1H", Math.max(points, 30));
            if (candles.length >= 8) {
              values[asset.id] = candles.slice(-points).map((candle) => candle.close);
              source = "delayed";
              return;
            }
          } catch {
            // fall through
          }
        }
        values[asset.id] = getDemoSparkline(asset, points, Date.now());
      }),
    );

    return { values, source };
  });
}

export function getProviderStatus(): ProviderStatus {
  const configured: string[] = [];
  if (coinGeckoConfigured()) configured.push("CoinGecko");
  if (twelveDataConfigured()) configured.push("Twelve Data");
  if (finnhubConfigured()) configured.push("Finnhub");

  if (demoForced()) {
    return {
      configured,
      mode: "demo",
      message:
        "MARKET_DATA_MODE=demo is set. All prices, charts and sparklines are simulated locally.",
    };
  }

  if (!configured.length) {
    return {
      configured,
      mode: "demo",
      message:
        "No market-data credentials detected. The terminal is running in demonstration mode with locally simulated prices.",
    };
  }

  return {
    configured,
    mode: "delayed",
    message: `Connected to ${configured.join(", ")}. Provider entitlements determine whether quotes are real-time or delayed. Charts fall back to demonstration data when a provider has no candle history for an instrument.`,
  };
}

export function providerEnvHints(): Array<{ name: string; label: string; description: string; configured: boolean }> {
  return [
    {
      name: "TWELVE_DATA_API_KEY",
      label: "Twelve Data",
      description: "Multi-asset quotes and time series for equities, FX, indices and crypto.",
      configured: twelveDataConfigured(),
    },
    {
      name: "FINNHUB_API_KEY",
      label: "Finnhub",
      description: "US equity quotes and crypto candles. Stock candle history needs a paid plan.",
      configured: finnhubConfigured(),
    },
    {
      name: "COINGECKO_API_KEY",
      label: "CoinGecko",
      description: "Aggregated crypto prices, 24h stats and OHLC history.",
      configured: coinGeckoConfigured(),
    },
    {
      name: "MARKET_DATA_MODE",
      label: "Force demo mode",
      description: "Set to 'demo' to ignore provider credentials and always use simulated data.",
      configured: demoForced(),
    },
  ];
}

export function clearMarketCache(): void {
  cache.clear();
}

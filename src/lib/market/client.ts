import type { Asset, Candle, CandleResult, DataSourceKind, ProviderStatus, Quote, Timeframe } from "./types";

export class MarketApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "MarketApiError";
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal, cache: "no-store" });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore body parse errors
    }
    throw new MarketApiError(message, response.status);
  }
  return (await response.json()) as T;
}

export async function fetchQuotes(symbols: string[], signal?: AbortSignal): Promise<Quote[]> {
  if (!symbols.length) return [];
  const body = await request<{ quotes: Quote[] }>(
    `/api/market/quotes?symbols=${encodeURIComponent(symbols.join(","))}`,
    signal,
  );
  return body.quotes;
}

export interface SnapshotResponse {
  snapshots: Record<string, { quote: Quote; sparkline: number[] }>;
  source: DataSourceKind;
  sparklineSource: DataSourceKind;
  timestamp: number;
}

export async function fetchSnapshots(
  symbols: string[],
  points = 36,
  signal?: AbortSignal,
): Promise<SnapshotResponse> {
  if (!symbols.length) {
    return { snapshots: {}, source: "demo", sparklineSource: "demo", timestamp: Date.now() };
  }
  return request<SnapshotResponse>(
    `/api/market/snapshots?symbols=${encodeURIComponent(symbols.join(","))}&points=${points}`,
    signal,
  );
}

export type CandleResponse = CandleResult;

export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  limit = 480,
  signal?: AbortSignal,
): Promise<CandleResponse> {
  return request<CandleResponse>(
    `/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`,
    signal,
  );
}

export interface DataStatusResponse extends ProviderStatus {
  providers: Array<{ name: string; label: string; description: string; configured: boolean }>;
  timestamp: number;
}

export async function fetchDataStatus(signal?: AbortSignal): Promise<DataStatusResponse> {
  return request<DataStatusResponse>("/api/market/status", signal);
}

export function quoteBySymbol(quotes: Quote[], symbol: string): Quote | undefined {
  return quotes.find((quote) => quote.symbol === symbol);
}

export type { Candle };

export type AssetClass = "crypto" | "stock" | "etf" | "forex" | "index" | "commodity";

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  crypto: "Crypto",
  stock: "Stocks",
  etf: "ETFs",
  forex: "Forex",
  index: "Indices",
  commodity: "Commodities",
};

export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1H" | "4H" | "1D" | "1W" | "1M";

export type ChartType = "candles" | "bars" | "line" | "area";

export type DataSourceKind = "live" | "delayed" | "demo";

export interface Asset {
  /** Canonical internal id, e.g. BTCUSD */
  id: string;
  /** Display symbol, e.g. BTC/USD */
  symbol: string;
  name: string;
  class: AssetClass;
  exchange: string;
  currency: string;
  sector?: string;
  description: string;
  /** Demo anchor price in USD */
  basePrice: number;
  /** Approximate daily volatility (fraction) */
  volatility: number;
  /** Approximate daily drift for demo history */
  drift: number;
  avgVolume: number;
  marketCap?: number;
  /** Provider identifiers for live integrations */
  providerIds?: {
    twelveData?: string;
    finnhub?: string;
    coinGecko?: string;
  };
  keywords?: string[];
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  timestamp: number;
  source: DataSourceKind;
  provider: string;
  currency: string;
  marketCap?: number;
  note?: string;
}

export interface Candle {
  /** UTC timestamp in seconds */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetSnapshot {
  quote: Quote;
  sparkline: number[];
}

export interface CandleResult {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  source: DataSourceKind;
  provider: string;
  note?: string;
  timestamp: number;
}

export interface SparklineResult {
  values: Record<string, number[]>;
  source: DataSourceKind;
}

export interface MarketStatus {
  state: "open" | "closed" | "pre" | "post" | "24-7";
  label: string;
  detail: string;
}

export interface TimeframeMeta {
  id: Timeframe;
  label: string;
  seconds: number;
  intraday: boolean;
  twelveData: string;
  finnhub: string;
}

export const TIMEFRAMES: TimeframeMeta[] = [
  { id: "1m", label: "1m", seconds: 60, intraday: true, twelveData: "1min", finnhub: "1" },
  { id: "5m", label: "5m", seconds: 300, intraday: true, twelveData: "5min", finnhub: "5" },
  { id: "15m", label: "15m", seconds: 900, intraday: true, twelveData: "15min", finnhub: "15" },
  { id: "30m", label: "30m", seconds: 1800, intraday: true, twelveData: "30min", finnhub: "30" },
  { id: "1H", label: "1H", seconds: 3600, intraday: true, twelveData: "1h", finnhub: "60" },
  { id: "4H", label: "4H", seconds: 14400, intraday: true, twelveData: "4h", finnhub: "240" },
  { id: "1D", label: "1D", seconds: 86400, intraday: false, twelveData: "1day", finnhub: "D" },
  { id: "1W", label: "1W", seconds: 604800, intraday: false, twelveData: "1week", finnhub: "W" },
  { id: "1M", label: "1M", seconds: 2592000, intraday: false, twelveData: "1month", finnhub: "M" },
];

export function getTimeframe(id: Timeframe): TimeframeMeta {
  return TIMEFRAMES.find((t) => t.id === id) ?? TIMEFRAMES[6];
}

export type ProviderStatus = {
  configured: string[];
  mode: "live" | "delayed" | "demo";
  message: string;
};

export interface MarketDataProvider {
  id: string;
  label: string;
  supports: (asset: Asset) => boolean;
  getQuotes: (assets: Asset[]) => Promise<Quote[]>;
  getCandles: (asset: Asset, timeframe: Timeframe, limit: number) => Promise<Candle[]>;
}

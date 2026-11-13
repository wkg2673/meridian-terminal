"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchCandles,
  fetchDataStatus,
  fetchQuotes,
  fetchSnapshots,
  type SnapshotResponse,
} from "@/lib/market/client";
import type { Quote, Timeframe } from "@/lib/market/types";
import { useTerminal } from "@/stores/terminal-store";

export const marketKeys = {
  snapshots: (symbols: string[], points: number) => ["market", "snapshots", [...symbols].sort(), points] as const,
  quotes: (symbols: string[]) => ["market", "quotes", [...symbols].sort()] as const,
  candles: (symbol: string, timeframe: Timeframe) => ["market", "candles", symbol, timeframe] as const,
  status: ["market", "status"] as const,
};

export function useSnapshots(symbols: string[], points = 36) {
  const live = useTerminal((state) => state.liveUpdates);
  return useQuery<SnapshotResponse>({
    queryKey: marketKeys.snapshots(symbols, points),
    queryFn: ({ signal }) => fetchSnapshots(symbols, points, signal),
    enabled: symbols.length > 0,
    refetchInterval: live ? 7_000 : false,
    placeholderData: keepPreviousData,
    staleTime: 3_000,
  });
}

export function useQuotes(symbols: string[], options?: { enabled?: boolean; refetchInterval?: number }) {
  const live = useTerminal((state) => state.liveUpdates);
  return useQuery<Quote[]>({
    queryKey: marketKeys.quotes(symbols),
    queryFn: ({ signal }) => fetchQuotes(symbols, signal),
    enabled: (options?.enabled ?? true) && symbols.length > 0,
    refetchInterval: live ? (options?.refetchInterval ?? 8_000) : false,
    placeholderData: keepPreviousData,
    staleTime: 3_000,
  });
}

export function useCandles(symbol: string, timeframe: Timeframe) {
  const live = useTerminal((state) => state.liveUpdates);
  return useQuery({
    queryKey: marketKeys.candles(symbol, timeframe),
    queryFn: ({ signal }) => fetchCandles(symbol, timeframe, 480, signal),
    enabled: Boolean(symbol),
    refetchInterval: live ? 15_000 : false,
    placeholderData: keepPreviousData,
    staleTime: 4_000,
  });
}

export function useDataStatus() {
  return useQuery({
    queryKey: marketKeys.status,
    queryFn: ({ signal }) => fetchDataStatus(signal),
    staleTime: 60_000,
    retry: 1,
  });
}

export function quoteMap(quotes: Quote[] | undefined): Map<string, Quote> {
  return new Map((quotes ?? []).map((quote) => [quote.symbol, quote]));
}

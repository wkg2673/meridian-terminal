"use client";

import { useMemo } from "react";
import { getAsset } from "@/lib/market/assets";
import type { Asset, Quote } from "@/lib/market/types";
import { useSnapshots } from "@/hooks/use-market-data";
import { usePortfolio, type Holding } from "@/stores/portfolio-store";

export interface PositionMetrics {
  holding: Holding;
  asset: Asset | undefined;
  quote: Quote | undefined;
  price: number;
  marketValue: number;
  costBasis: number;
  pnl: number;
  pnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  weight: number;
  sparkline: number[];
}

export interface PortfolioTotals {
  totalValue: number;
  investedValue: number;
  costBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
}

export function usePortfolioMetrics() {
  const holdings = usePortfolio((state) => state.holdings);
  const cash = usePortfolio((state) => state.cash);
  const symbols = useMemo(() => holdings.map((holding) => holding.symbol), [holdings]);
  const snapshotsQuery = useSnapshots(symbols, 32);

  const positions = useMemo<PositionMetrics[]>(() => {
    const snapshots = snapshotsQuery.data?.snapshots ?? {};
    const rows = holdings.map((holding) => {
      const asset = getAsset(holding.symbol);
      const snapshot = asset ? snapshots[asset.symbol] : undefined;
      const quote = snapshot?.quote;
      const price = quote?.price ?? holding.avgPrice;
      const marketValue = price * holding.quantity;
      const costBasis = holding.avgPrice * holding.quantity;
      const pnl = marketValue - costBasis;
      const dayPnl = (price - (quote?.prevClose ?? price)) * holding.quantity;
      return {
        holding,
        asset,
        quote,
        price,
        marketValue,
        costBasis,
        pnl,
        pnlPercent: costBasis ? (pnl / costBasis) * 100 : 0,
        dayPnl,
        dayPnlPercent: 0,
        weight: 0,
        sparkline: snapshot?.sparkline ?? [],
      } satisfies PositionMetrics;
    });

    const invested = rows.reduce((sum, row) => sum + row.marketValue, 0);
    const corpus = invested + cash;
    for (const row of rows) {
      row.weight = corpus ? (row.marketValue / corpus) * 100 : 0;
      const prior = row.marketValue - row.dayPnl;
      row.dayPnlPercent = prior ? (row.dayPnl / prior) * 100 : 0;
    }
    return rows.sort((a, b) => b.marketValue - a.marketValue);
  }, [holdings, snapshotsQuery.data, cash]);

  const totals = useMemo<PortfolioTotals>(() => {
    const investedValue = positions.reduce((sum, row) => sum + row.marketValue, 0);
    const costBasis = positions.reduce((sum, row) => sum + row.costBasis, 0);
    const totalPnl = investedValue - costBasis;
    const dayPnl = positions.reduce((sum, row) => sum + row.dayPnl, 0);
    const prior = investedValue - dayPnl;
    return {
      totalValue: investedValue + cash,
      investedValue,
      costBasis,
      totalPnl,
      totalPnlPercent: costBasis ? (totalPnl / costBasis) * 100 : 0,
      dayPnl,
      dayPnlPercent: prior ? (dayPnl / prior) * 100 : 0,
    };
  }, [positions, cash]);

  const portfolioSparkline = useMemo(() => {
    if (!positions.length) return [];
    const series = positions
      .filter((position) => position.sparkline.length > 1)
      .map((position) => ({ weight: position.holding.quantity, values: position.sparkline }));
    if (!series.length) return [];
    const length = Math.min(...series.map((entry) => entry.values.length));
    const result: number[] = [];
    for (let index = 0; index < length; index += 1) {
      const total = series.reduce((sum, entry) => {
        const offset = entry.values.length - length + index;
        return sum + entry.values[offset] * entry.weight;
      }, cash);
      result.push(total);
    }
    return result;
  }, [positions, cash]);

  return {
    positions,
    totals,
    cash,
    hydrated: usePortfolio((state) => state.hydrated),
    isLoading: snapshotsQuery.isLoading || !snapshotsQuery.data,
    isFetching: snapshotsQuery.isFetching,
    timestamp: snapshotsQuery.data?.timestamp,
    error: snapshotsQuery.error,
    refetch: snapshotsQuery.refetch,
    portfolioSparkline,
    source: snapshotsQuery.data?.source ?? "demo",
  };
}

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { uid } from "@/lib/utils";

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  purchasedAt: number;
  notes?: string;
}

const SAMPLE_HOLDINGS: Holding[] = [
  { id: "sample_btc", symbol: "BTCUSD", quantity: 0.42, avgPrice: 82450, purchasedAt: Date.parse("2026-04-18T14:30:00Z") },
  { id: "sample_eth", symbol: "ETHUSD", quantity: 3.5, avgPrice: 3120, purchasedAt: Date.parse("2026-05-06T09:12:00Z") },
  { id: "sample_nvda", symbol: "NVDA", quantity: 120, avgPrice: 186.2, purchasedAt: Date.parse("2026-06-24T15:45:00Z") },
  { id: "sample_aapl", symbol: "AAPL", quantity: 60, avgPrice: 228.5, purchasedAt: Date.parse("2026-03-11T13:05:00Z") },
  { id: "sample_msft", symbol: "MSFT", quantity: 25, avgPrice: 452.1, purchasedAt: Date.parse("2026-07-02T16:20:00Z") },
  { id: "sample_eurusd", symbol: "EURUSD", quantity: 10000, avgPrice: 1.0942, purchasedAt: Date.parse("2026-05-28T08:30:00Z") },
];

interface PortfolioState {
  holdings: Holding[];
  cash: number;
  isSample: boolean;
  hydrated: boolean;
  addHolding: (holding: Omit<Holding, "id" | "purchasedAt"> & { purchasedAt?: number }) => string;
  updateHolding: (id: string, patch: Partial<Omit<Holding, "id">>) => void;
  removeHolding: (id: string) => void;
  setCash: (value: number) => void;
  clearHoldings: () => void;
  restoreSamplePortfolio: () => void;
  setHydrated: (value: boolean) => void;
}

export const usePortfolio = create<PortfolioState>()(
  persist(
    (set) => ({
      holdings: SAMPLE_HOLDINGS,
      cash: 25000,
      isSample: true,
      hydrated: false,
      addHolding: (holding) => {
        const id = uid("hold");
        set((state) => ({
          holdings: [
            ...state.holdings,
            {
              ...holding,
              id,
              purchasedAt: holding.purchasedAt ?? Date.now(),
              notes: holding.notes,
            },
          ],
        }));
        return id;
      },
      updateHolding: (id, patch) =>
        set((state) => ({
          holdings: state.holdings.map((holding) => (holding.id === id ? { ...holding, ...patch } : holding)),
        })),
      removeHolding: (id) =>
        set((state) => ({ holdings: state.holdings.filter((holding) => holding.id !== id) })),
      setCash: (cash) => set({ cash: Math.max(0, cash) }),
      clearHoldings: () => set({ holdings: [], isSample: false }),
      restoreSamplePortfolio: () => set({ holdings: SAMPLE_HOLDINGS, cash: 25000, isSample: true }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "meridian.portfolio",
      version: 1,
      skipHydration: true,
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

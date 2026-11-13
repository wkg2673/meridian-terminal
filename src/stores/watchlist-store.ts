"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_WATCHLIST_SYMBOLS } from "@/lib/market/assets";
import { uid } from "@/lib/utils";

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

const DEFAULT_LISTS: Watchlist[] = [
  { id: "wl_core", name: "Core Watchlist", symbols: DEFAULT_WATCHLIST_SYMBOLS },
  {
    id: "wl_crypto",
    name: "Digital Assets",
    symbols: ["BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "LINKUSD", "AVAXUSD"],
  },
  {
    id: "wl_equities",
    name: "US Equities",
    symbols: ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "META", "AMD", "PLTR"],
  },
];

interface WatchlistState {
  lists: Watchlist[];
  activeListId: string;
  hydrated: boolean;
  setActiveList: (id: string) => void;
  addSymbol: (symbol: string, listId?: string) => "added" | "exists";
  removeSymbol: (symbol: string, listId?: string) => void;
  createList: (name: string) => string;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  resetWatchlists: () => void;
  restoreDefaults: () => void;
  setHydrated: (value: boolean) => void;
}

export const useWatchlists = create<WatchlistState>()(
  persist(
    (set, get) => ({
      lists: DEFAULT_LISTS,
      activeListId: DEFAULT_LISTS[0].id,
      hydrated: false,
      setActiveList: (activeListId) => set({ activeListId }),
      addSymbol: (symbol, listId) => {
        const state = get();
        const targetId = listId ?? state.activeListId;
        const target = state.lists.find((list) => list.id === targetId) ?? state.lists[0];
        if (target.symbols.includes(symbol)) return "exists";
        set({
          lists: state.lists.map((list) =>
            list.id === target.id ? { ...list, symbols: [...list.symbols, symbol] } : list,
          ),
        });
        return "added";
      },
      removeSymbol: (symbol, listId) => {
        const state = get();
        const targetId = listId ?? state.activeListId;
        set({
          lists: state.lists.map((list) =>
            list.id === targetId
              ? { ...list, symbols: list.symbols.filter((entry) => entry !== symbol) }
              : list,
          ),
        });
      },
      createList: (name) => {
        const id = uid("wl");
        set((state) => ({
          lists: [...state.lists, { id, name: name.trim() || "New watchlist", symbols: [] }],
          activeListId: id,
        }));
        return id;
      },
      renameList: (id, name) =>
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id ? { ...list, name: name.trim() || list.name } : list,
          ),
        })),
      deleteList: (id) =>
        set((state) => {
          if (state.lists.length <= 1) return state;
          const lists = state.lists.filter((list) => list.id !== id);
          return {
            lists,
            activeListId: state.activeListId === id ? lists[0].id : state.activeListId,
          };
        }),
      resetWatchlists: () =>
        set({ lists: [{ ...DEFAULT_LISTS[0], symbols: [...DEFAULT_WATCHLIST_SYMBOLS] }], activeListId: DEFAULT_LISTS[0].id }),
      restoreDefaults: () => set({ lists: DEFAULT_LISTS, activeListId: DEFAULT_LISTS[0].id }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "meridian.watchlists",
      version: 1,
      skipHydration: true,
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function useActiveWatchlist(): Watchlist {
  return useWatchlists(
    (state) => state.lists.find((list) => list.id === state.activeListId) ?? state.lists[0],
  );
}

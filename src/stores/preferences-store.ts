"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChartType, Timeframe } from "@/lib/market/types";

export type ThemeMode = "dark" | "light" | "system";

interface PreferencesState {
  theme: ThemeMode;
  defaultTimeframe: Timeframe;
  defaultChartType: ChartType;
  chartGrid: boolean;
  chartCrosshair: boolean;
  showSparklines: boolean;
  reduceMotion: boolean;
  hydrated: boolean;
  setTheme: (theme: ThemeMode) => void;
  setDefaultTimeframe: (timeframe: Timeframe) => void;
  setDefaultChartType: (chartType: ChartType) => void;
  setChartGrid: (value: boolean) => void;
  setChartCrosshair: (value: boolean) => void;
  setShowSparklines: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
  resetPreferences: () => void;
}

const DEFAULTS = {
  theme: "dark" as ThemeMode,
  defaultTimeframe: "1H" as Timeframe,
  defaultChartType: "candles" as ChartType,
  chartGrid: true,
  chartCrosshair: true,
  showSparklines: true,
  reduceMotion: false,
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      hydrated: false,
      setTheme: (theme) => set({ theme }),
      setDefaultTimeframe: (defaultTimeframe) => set({ defaultTimeframe }),
      setDefaultChartType: (defaultChartType) => set({ defaultChartType }),
      setChartGrid: (chartGrid) => set({ chartGrid }),
      setChartCrosshair: (chartCrosshair) => set({ chartCrosshair }),
      setShowSparklines: (showSparklines) => set({ showSparklines }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setHydrated: (hydrated) => set({ hydrated }),
      resetPreferences: () => set({ ...DEFAULTS }),
    }),
    {
      name: "meridian.preferences",
      version: 1,
      skipHydration: true,
      partialize: ({ hydrated, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const THEME_STORAGE_KEY = "meridian.preferences";

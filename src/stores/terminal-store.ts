"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChartType, Timeframe } from "@/lib/market/types";
import { DEFAULT_SYMBOL } from "@/lib/market/assets";
import { uid } from "@/lib/utils";

export type PriceScaleMode = "normal" | "logarithmic" | "percentage";

export interface IndicatorState {
  sma: { enabled: boolean; period: number; color: string };
  ema: { enabled: boolean; period: number; color: string };
  rsi: { enabled: boolean; period: number; overbought: number; oversold: number };
  macd: { enabled: boolean; fast: number; slow: number; signal: number };
  bb: { enabled: boolean; period: number; stdDev: number };
  volume: { enabled: boolean };
}

export type IndicatorId = keyof IndicatorState;

export const INDICATOR_META: Record<
  IndicatorId,
  { label: string; short: string; description: string; pane: boolean; color: string }
> = {
  sma: { label: "Simple Moving Average", short: "SMA", description: "Average close over a rolling window.", pane: false, color: "#f0b90b" },
  ema: { label: "Exponential Moving Average", short: "EMA", description: "Weighted average emphasising recent prices.", pane: false, color: "#a78bfa" },
  bb: { label: "Bollinger Bands", short: "BB", description: "Volatility envelope around a moving average.", pane: false, color: "#64748b" },
  volume: { label: "Volume", short: "VOL", description: "Traded volume per bar.", pane: true, color: "#64748b" },
  rsi: { label: "Relative Strength Index", short: "RSI", description: "Momentum oscillator scaled from 0 to 100.", pane: true, color: "#22d3ee" },
  macd: { label: "MACD", short: "MACD", description: "Moving average convergence / divergence.", pane: true, color: "#38bdf8" },
};

export const DEFAULT_INDICATORS: IndicatorState = {
  sma: { enabled: true, period: 20, color: "#f0b90b" },
  ema: { enabled: true, period: 50, color: "#a78bfa" },
  bb: { enabled: false, period: 20, stdDev: 2 },
  volume: { enabled: true },
  rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
};

export type DrawingType = "trendline" | "horizontal" | "vertical" | "rectangle" | "text" | "fib";
export type DrawingTool = "cursor" | DrawingType;

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingShape {
  id: string;
  type: DrawingType;
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  text?: string;
  createdAt: number;
}

interface TerminalState {
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  priceScaleMode: PriceScaleMode;
  indicators: IndicatorState;
  activeTool: DrawingTool;
  drawingColor: string;
  selectedDrawingId: string | null;
  drawings: Record<string, DrawingShape[]>;
  rightPanelOpen: boolean;
  rightPanelWidth: number;
  objectPanelOpen: boolean;
  liveUpdates: boolean;
  hydrated: boolean;
  setSymbol: (symbol: string) => void;
  setTimeframe: (timeframe: Timeframe) => void;
  setChartType: (chartType: ChartType) => void;
  setPriceScaleMode: (mode: PriceScaleMode) => void;
  toggleIndicator: (id: IndicatorId) => void;
  updateIndicator: <K extends IndicatorId>(id: K, patch: Partial<IndicatorState[K]>) => void;
  resetIndicators: () => void;
  setActiveTool: (tool: DrawingTool) => void;
  setDrawingColor: (color: string) => void;
  addDrawing: (drawing: Omit<DrawingShape, "id" | "createdAt">) => string;
  updateDrawing: (id: string, patch: Partial<DrawingShape>) => void;
  removeDrawing: (id: string) => void;
  clearDrawings: (symbol?: string) => void;
  selectDrawing: (id: string | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setRightPanelWidth: (width: number) => void;
  setObjectPanelOpen: (open: boolean) => void;
  setLiveUpdates: (value: boolean) => void;
  setHydrated: (value: boolean) => void;
}

export const useTerminal = create<TerminalState>()(
  persist(
    (set, get) => ({
      symbol: DEFAULT_SYMBOL,
      timeframe: "1H",
      chartType: "candles",
      priceScaleMode: "normal",
      indicators: DEFAULT_INDICATORS,
      activeTool: "cursor",
      drawingColor: "#5b8cff",
      selectedDrawingId: null,
      drawings: {},
      rightPanelOpen: true,
      rightPanelWidth: 336,
      objectPanelOpen: false,
      liveUpdates: true,
      hydrated: false,
      setSymbol: (symbol) =>
        set({ symbol, selectedDrawingId: null, activeTool: "cursor" }),
      setTimeframe: (timeframe) => set({ timeframe }),
      setChartType: (chartType) => set({ chartType }),
      setPriceScaleMode: (priceScaleMode) => set({ priceScaleMode }),
      toggleIndicator: (id) =>
        set((state) => ({
          indicators: {
            ...state.indicators,
            [id]: { ...state.indicators[id], enabled: !state.indicators[id].enabled },
          },
        })),
      updateIndicator: (id, patch) =>
        set((state) => ({
          indicators: {
            ...state.indicators,
            [id]: { ...state.indicators[id], ...patch },
          },
        })),
      resetIndicators: () => set({ indicators: DEFAULT_INDICATORS }),
      setActiveTool: (activeTool) => set({ activeTool, selectedDrawingId: null }),
      setDrawingColor: (drawingColor) => set({ drawingColor }),
      addDrawing: (drawing) => {
        const id = uid("dr");
        const shape: DrawingShape = { ...drawing, id, createdAt: Date.now() };
        set((state) => ({
          drawings: {
            ...state.drawings,
            [state.symbol]: [...(state.drawings[state.symbol] ?? []), shape],
          },
          selectedDrawingId: id,
          activeTool: "cursor",
        }));
        return id;
      },
      updateDrawing: (id, patch) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [state.symbol]: (state.drawings[state.symbol] ?? []).map((drawing) =>
              drawing.id === id ? { ...drawing, ...patch } : drawing,
            ),
          },
        })),
      removeDrawing: (id) =>
        set((state) => ({
          drawings: {
            ...state.drawings,
            [state.symbol]: (state.drawings[state.symbol] ?? []).filter((drawing) => drawing.id !== id),
          },
          selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
        })),
      clearDrawings: (symbol) =>
        set((state) => ({
          drawings: symbol ? { ...state.drawings, [symbol]: [] } : { ...state.drawings, [state.symbol]: [] },
          selectedDrawingId: null,
        })),
      selectDrawing: (selectedDrawingId) => set({ selectedDrawingId }),
      setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
      toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
      setRightPanelWidth: (rightPanelWidth) => set({ rightPanelWidth }),
      setObjectPanelOpen: (objectPanelOpen) => set({ objectPanelOpen }),
      setLiveUpdates: (liveUpdates) => set({ liveUpdates }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "meridian.terminal",
      version: 1,
      skipHydration: true,
      partialize: ({ hydrated, selectedDrawingId, activeTool, ...rest }) => rest,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

const EMPTY_DRAWINGS: DrawingShape[] = [];

export function useDrawingsForSymbol(): DrawingShape[] {
  return useTerminal((state) => state.drawings[state.symbol] ?? EMPTY_DRAWINGS);
}

export function useSelectedAssetSymbol(): string {
  return useTerminal((state) => state.symbol);
}

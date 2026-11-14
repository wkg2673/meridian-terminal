"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  BarSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  createChart,
  type CandlestickData,
  type Coordinate,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Logical,
  type MouseEventParams,
  type SeriesType,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCandles } from "@/hooks/use-market-data";
import { useResolvedTheme } from "@/hooks/use-theme";
import { getChartTheme, type ChartTheme } from "@/lib/chart/theme";
import { bollingerBands, ema, lastValue, macd, rsi, sma } from "@/lib/chart/indicators";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import { getTimeframe, type Candle } from "@/lib/market/types";
import { usePreferences } from "@/stores/preferences-store";
import {
  useDrawingsForSymbol,
  useTerminal,
  type DrawingPoint,
  type DrawingShape,
  type DrawingType,
} from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const DRAWING_LABELS: Record<DrawingType, string> = {
  trendline: "Trend line",
  horizontal: "Horizontal line",
  vertical: "Vertical line",
  rectangle: "Rectangle",
  text: "Text note",
  fib: "Fibonacci retracement",
};

interface SeriesBundle {
  main: ISeriesApi<SeriesType> | null;
  volume: ISeriesApi<"Histogram"> | null;
  sma: ISeriesApi<"Line"> | null;
  ema: ISeriesApi<"Line"> | null;
  bbUpper: ISeriesApi<"Line"> | null;
  bbMiddle: ISeriesApi<"Line"> | null;
  bbLower: ISeriesApi<"Line"> | null;
  rsi: ISeriesApi<"Line"> | null;
  macdLine: ISeriesApi<"Line"> | null;
  macdSignal: ISeriesApi<"Line"> | null;
  macdHistogram: ISeriesApi<"Histogram"> | null;
}

const EMPTY_BUNDLE: SeriesBundle = {
  main: null,
  volume: null,
  sma: null,
  ema: null,
  bbUpper: null,
  bbMiddle: null,
  bbLower: null,
  rsi: null,
  macdLine: null,
  macdSignal: null,
  macdHistogram: null,
};

interface PixelPoint {
  x: number;
  y: number;
}

function distanceToSegment(point: PixelPoint, start: PixelPoint, end: PixelPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function scaleModeToEnum(mode: "normal" | "logarithmic" | "percentage"): PriceScaleMode {
  if (mode === "logarithmic") return PriceScaleMode.Logarithmic;
  if (mode === "percentage") return PriceScaleMode.Percentage;
  return PriceScaleMode.Normal;
}

export function PriceChart({ className }: { className?: string }) {
  const symbol = useTerminal((state) => state.symbol);
  const timeframe = useTerminal((state) => state.timeframe);
  const chartType = useTerminal((state) => state.chartType);
  const priceScaleMode = useTerminal((state) => state.priceScaleMode);
  const indicators = useTerminal((state) => state.indicators);
  const activeTool = useTerminal((state) => state.activeTool);
  const drawingColor = useTerminal((state) => state.drawingColor);
  const selectedDrawingId = useTerminal((state) => state.selectedDrawingId);
  const addDrawing = useTerminal((state) => state.addDrawing);
  const updateDrawing = useTerminal((state) => state.updateDrawing);
  const removeDrawing = useTerminal((state) => state.removeDrawing);
  const selectDrawing = useTerminal((state) => state.selectDrawing);
  const drawings = useDrawingsForSymbol();

  const chartGrid = usePreferences((state) => state.chartGrid);
  const chartCrosshair = usePreferences((state) => state.chartCrosshair);
  const resolvedTheme = useResolvedTheme();
  const theme = useMemo(() => getChartTheme(resolvedTheme), [resolvedTheme]);

  const asset = getAsset(symbol);
  const { data, isLoading, isError, error, refetch } = useCandles(symbol, timeframe);
  const candles = useMemo(() => data?.candles ?? [], [data]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<SeriesBundle>({ ...EMPTY_BUNDLE });
  const createdSeriesRef = useRef<ISeriesApi<SeriesType>[]>([]);
  const candlesRef = useRef<Candle[]>([]);
  const themeRef = useRef<ChartTheme>(theme);
  const [ready, setReady] = useState(false);
  const [viewTick, setViewTick] = useState(0);
  const [legendCandle, setLegendCandle] = useState<Candle | null>(null);
  const [draft, setDraft] = useState<DrawingPoint[] | null>(null);
  const [preview, setPreview] = useState<DrawingPoint | null>(null);
  const [textPoint, setTextPoint] = useState<DrawingPoint | null>(null);
  const [textValue, setTextValue] = useState("");
  const [paneHeight, setPaneHeight] = useState(0);

  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);
  const activeToolRef = useRef(activeTool);
  const drawingColorRef = useRef(drawingColor);
  const drawingsRef = useRef(drawings);
  const legendRef = useRef<Candle | null>(null);

  symbolRef.current = symbol;
  timeframeRef.current = timeframe;
  activeToolRef.current = activeTool;
  drawingColorRef.current = drawingColor;
  drawingsRef.current = drawings;
  themeRef.current = theme;

  const selectedDrawing = useMemo(
    () => drawings.find((drawing) => drawing.id === selectedDrawingId) ?? null,
    [drawings, selectedDrawingId],
  );

  const displayCandle = legendCandle ?? (candles.length ? candles[candles.length - 1] : null);
  const displayAsset = asset;
  const assetDecimals = displayAsset?.class === "forex" ? (displayAsset.symbol.includes("JPY") ? 3 : 5) : undefined;

  /* ── Coordinate helpers ──────────────────────────────────────────────── */

  const toPixel = useCallback((point: DrawingPoint): PixelPoint | null => {
    const chart = chartRef.current;
    const series = seriesRef.current.main;
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(point.time as UTCTimestamp);
    const y = series.priceToCoordinate(point.price);
    if (x === null || y === null) return null;
    return { x: Number(x), y: Number(y) };
  }, []);

  const toPoint = useCallback((x: number, y: number): DrawingPoint | null => {
    const chart = chartRef.current;
    const series = seriesRef.current.main;
    if (!chart || !series) return null;
    const time = chart.timeScale().coordinateToTime(x as Coordinate);
    const price = series.coordinateToPrice(y as Coordinate);
    if (time === null || price === null) return null;
    return { time: Number(time), price: Number(price) };
  }, []);

  const panePoint = useCallback((event: React.PointerEvent | React.MouseEvent): PixelPoint => {
    const rect = containerRef.current?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }, []);

  /* ── Chart lifecycle ─────────────────────────────────────────────────── */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: themeRef.current.text,
        fontFamily: "Inter Variable, Inter, system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
        panes: {
          separatorColor: "hsl(var(--border))",
          separatorHoverColor: "hsl(var(--brand) / 0.4)",
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: themeRef.current.grid },
        horzLines: { color: themeRef.current.grid },
      },
      rightPriceScale: {
        borderColor: "hsl(var(--border))",
        scaleMargins: { top: 0.12, bottom: 0.08 },
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: "hsl(var(--border))",
        rightOffset: 8,
        barSpacing: 8,
        minBarSpacing: 0.5,
        timeVisible: getTimeframe(timeframeRef.current).intraday,
        secondsVisible: false,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: themeRef.current.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: themeRef.current.brand,
        },
        horzLine: {
          color: themeRef.current.crosshair,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: themeRef.current.brand,
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      localization: {
        locale: "en-US",
        priceFormatter: (price: number) =>
          formatPrice(price, getAsset(symbolRef.current), {
            decimals: getAsset(symbolRef.current)?.class === "forex"
              ? getAsset(symbolRef.current)?.symbol.includes("JPY")
                ? 3
                : 5
              : undefined,
          }),
      },
    });

    chartRef.current = chart;
    setReady(true);

    const onCrosshair = (param: MouseEventParams<Time>) => {
      if (!param.time) {
        legendRef.current = null;
        setLegendCandle(null);
        return;
      }
      const time = Number(param.time);
      const candle = candlesRef.current.find((entry) => entry.time === time) ?? null;
      legendRef.current = candle;
      setLegendCandle(candle);
    };
    chart.subscribeCrosshairMove(onCrosshair);

    const onClick = (param: MouseEventParams<Time>) => {
      const state = useTerminal.getState();
      if (state.activeTool !== "cursor" || !param.point) return;
      const target = hitTest(param.point.x, param.point.y);
      state.selectDrawing(target?.id ?? null);
    };
    chart.subscribeClick(onClick);

    let frame = 0;
    const scheduleView = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setViewTick((tick) => tick + 1);
        setPaneHeight(chart.paneSize(0).height);
      });
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(scheduleView);

    const observer = new ResizeObserver(scheduleView);
    observer.observe(container);

    const resetHandler = () => {
      chart.timeScale().fitContent();
      chart.priceScale("right").applyOptions({ autoScale: true });
    };
    const screenshotHandler = () => {
      try {
        const canvas = chart.takeScreenshot(true, false);
        const link = document.createElement("a");
        link.download = `meridian-${symbolRef.current}-${timeframeRef.current}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch {
        // screenshot unsupported in some environments
      }
    };
    window.addEventListener("meridian:reset-chart", resetHandler);
    window.addEventListener("meridian:screenshot-chart", screenshotHandler);

    return () => {
      window.removeEventListener("meridian:reset-chart", resetHandler);
      window.removeEventListener("meridian:screenshot-chart", screenshotHandler);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.unsubscribeClick(onClick);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(scheduleView);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = { ...EMPTY_BUNDLE };
      createdSeriesRef.current = [];
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function hitTest(x: number, y: number): DrawingShape | null {
    const list = drawingsRef.current;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const drawing = list[index];
      const points = drawing.points.map(toPixel);
      if (points.some((point) => !point)) continue;
      const pixels = points as PixelPoint[];

      if (drawing.type === "horizontal" && pixels[0]) {
        if (Math.abs(y - pixels[0].y) < 7) return drawing;
      } else if (drawing.type === "vertical" && pixels[0]) {
        if (Math.abs(x - pixels[0].x) < 7) return drawing;
      } else if (drawing.type === "trendline" && pixels[0] && pixels[1]) {
        if (distanceToSegment({ x, y }, pixels[0], pixels[1]) < 7) return drawing;
      } else if (drawing.type === "rectangle" && pixels[0] && pixels[1]) {
        const left = Math.min(pixels[0].x, pixels[1].x);
        const right = Math.max(pixels[0].x, pixels[1].x);
        const top = Math.min(pixels[0].y, pixels[1].y);
        const bottom = Math.max(pixels[0].y, pixels[1].y);
        if (x >= left - 4 && x <= right + 4 && y >= top - 4 && y <= bottom + 4) return drawing;
      } else if (drawing.type === "text" && pixels[0]) {
        if (Math.abs(x - pixels[0].x) < 80 && Math.abs(y - pixels[0].y) < 18) return drawing;
      } else if (drawing.type === "fib" && pixels[0] && pixels[1]) {
        const top = Math.min(pixels[0].y, pixels[1].y);
        const bottom = Math.max(pixels[0].y, pixels[1].y);
        const left = Math.min(pixels[0].x, pixels[1].x);
        const right = Math.max(pixels[0].x, pixels[1].x);
        if (x >= left - 6 && x <= right + 6) {
          for (const level of FIB_LEVELS) {
            const levelY = top + (bottom - top) * level;
            if (Math.abs(y - levelY) < 6) return drawing;
          }
        }
      }
    }
    return null;
  }

  /* ── Rebuild series when chart options change ─────────────────────────── */

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !ready) return;

    for (const series of createdSeriesRef.current) {
      try {
        chart.removeSeries(series);
      } catch {
        // already removed
      }
    }
    createdSeriesRef.current = [];
    seriesRef.current = { ...EMPTY_BUNDLE };

    while (chart.panes().length > 1) {
      try {
        chart.removePane(chart.panes().length - 1);
      } catch {
        break;
      }
    }

    const colors = getChartTheme(resolvedTheme);
    const data = candlesRef.current;
    const config = useTerminal.getState().indicators;
    let paneIndex = 1;

    const mainOptions =
      chartType === "candles"
        ? {
            upColor: colors.up,
            downColor: colors.down,
            borderVisible: false,
            wickUpColor: colors.up,
            wickDownColor: colors.down,
            priceLineColor: colors.brand,
            priceLineStyle: LineStyle.Dotted,
            priceLineWidth: 1 as const,
          }
        : chartType === "bars"
          ? {
              upColor: colors.up,
              downColor: colors.down,
              thinBars: false,
              priceLineColor: colors.brand,
              priceLineStyle: LineStyle.Dotted,
              priceLineWidth: 1 as const,
            }
          : chartType === "line"
            ? {
                color: colors.brand,
                lineWidth: 2 as const,
                priceLineColor: colors.brand,
                priceLineStyle: LineStyle.Dotted,
                priceLineWidth: 1 as const,
                crosshairMarkerBorderColor: colors.surface,
                crosshairMarkerBackgroundColor: colors.brand,
              }
            : {
                lineColor: colors.brand,
                topColor: colors.areaTop,
                bottomColor: colors.areaBottom,
                lineWidth: 2 as const,
                priceLineColor: colors.brand,
                priceLineStyle: LineStyle.Dotted,
                priceLineWidth: 1 as const,
                crosshairMarkerBorderColor: colors.surface,
                crosshairMarkerBackgroundColor: colors.brand,
              };

    const main =
      chartType === "candles"
        ? chart.addSeries(CandlestickSeries, mainOptions, 0)
        : chartType === "bars"
          ? chart.addSeries(BarSeries, mainOptions, 0)
          : chartType === "line"
            ? chart.addSeries(LineSeries, mainOptions, 0)
            : chart.addSeries(AreaSeries, mainOptions, 0);

    seriesRef.current.main = main as ISeriesApi<SeriesType>;
    createdSeriesRef.current.push(main as ISeriesApi<SeriesType>);

    const addLine = (color: string, width: 1 | 2 | 3, pane = 0, style = LineStyle.Solid) => {
      const series = chart.addSeries(
        LineSeries,
        {
          color,
          lineWidth: width,
          lineStyle: style,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        },
        pane,
      );
      createdSeriesRef.current.push(series as ISeriesApi<SeriesType>);
      return series;
    };

    if (config.sma.enabled) {
      seriesRef.current.sma = addLine(config.sma.color, 2);
    }
    if (config.ema.enabled) {
      seriesRef.current.ema = addLine(config.ema.color, 2);
    }
    if (config.bb.enabled) {
      seriesRef.current.bbUpper = addLine(colors.bb, 1, 0, LineStyle.Dashed);
      seriesRef.current.bbMiddle = addLine(colors.bb, 1);
      seriesRef.current.bbLower = addLine(colors.bb, 1, 0, LineStyle.Dashed);
    }

    if (config.volume.enabled) {
      const volume = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: "volume",
        },
        paneIndex,
      );
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      seriesRef.current.volume = volume;
      createdSeriesRef.current.push(volume as ISeriesApi<SeriesType>);
      chart.panes()[paneIndex]?.setStretchFactor(0.9);
      paneIndex += 1;
    }

    if (config.rsi.enabled) {
      const rsiSeries = addLine(colors.rsi, 2, paneIndex);
      rsiSeries.priceScale().applyOptions({ scaleMargins: { top: 0.12, bottom: 0.12 } });
      seriesRef.current.rsi = rsiSeries;
      chart.panes()[paneIndex]?.setStretchFactor(1.1);
      paneIndex += 1;
    }

    if (config.macd.enabled) {
      const histogram = chart.addSeries(
        HistogramSeries,
        { priceLineVisible: false, lastValueVisible: false },
        paneIndex,
      );
      seriesRef.current.macdHistogram = histogram;
      createdSeriesRef.current.push(histogram as ISeriesApi<SeriesType>);
      seriesRef.current.macdLine = addLine(colors.macd, 1, paneIndex);
      seriesRef.current.macdSignal = addLine(colors.macdSignal, 1, paneIndex);
      chart.panes()[paneIndex]?.setStretchFactor(1.1);
    }

    chart.panes()[0]?.setStretchFactor(2.6);
    chart.timeScale().applyOptions({
      timeVisible: getTimeframe(timeframeRef.current).intraday,
      secondsVisible: false,
    });
    chart.priceScale("right").applyOptions({ mode: scaleModeToEnum(priceScaleMode) });

    // hydrate series with the latest candles
    const bundle = seriesRef.current;
    if (bundle.main) {
      if (chartType === "candles" || chartType === "bars") {
        (bundle.main as ISeriesApi<"Candlestick">).setData(
          data.map((candle) => ({
            time: candle.time as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          })),
        );
      } else {
        (bundle.main as ISeriesApi<"Line">).setData(
          data.map((candle) => ({ time: candle.time as UTCTimestamp, value: candle.close })),
        );
      }
    }

    if (bundle.volume && config.volume.enabled) {
      bundle.volume.setData(
        data.map((candle) => ({
          time: candle.time as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? colors.volumeUp : colors.volumeDown,
        })),
      );
    }

    if (bundle.sma) bundle.sma.setData(sma(data, config.sma.period).map(toLineData));
    if (bundle.ema) bundle.ema.setData(ema(data, config.ema.period).map(toLineData));

    if (bundle.bbUpper && bundle.bbMiddle && bundle.bbLower) {
      const bands = bollingerBands(data, config.bb.period, config.bb.stdDev);
      bundle.bbUpper.setData(bands.upper.map(toLineData));
      bundle.bbMiddle.setData(bands.middle.map(toLineData));
      bundle.bbLower.setData(bands.lower.map(toLineData));
    }

    if (bundle.rsi) {
      const points = rsi(data, config.rsi.period);
      bundle.rsi.setData(points.map(toLineData));
      bundle.rsi.createPriceLine({
        price: config.rsi.overbought,
        color: colors.down,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "OB",
      });
      bundle.rsi.createPriceLine({
        price: config.rsi.oversold,
        color: colors.up,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "OS",
      });
      bundle.rsi.createPriceLine({
        price: 50,
        color: colors.grid,
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: false,
        title: "",
      });
    }

    if (bundle.macdLine && bundle.macdSignal && bundle.macdHistogram) {
      const result = macd(data, config.macd.fast, config.macd.slow, config.macd.signal);
      bundle.macdLine.setData(result.macd.map(toLineData));
      bundle.macdSignal.setData(result.signal.map(toLineData));
      bundle.macdHistogram.setData(
        result.histogram.map((point) => ({
          time: point.time as UTCTimestamp,
          value: point.value,
          color: point.positive ? colors.volumeUp : colors.volumeDown,
        })),
      );
    }

    setPaneHeight(chart.paneSize(0).height);
    setViewTick((tick) => tick + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, chartType, priceScaleMode, indicators, resolvedTheme]);

  /* ── Sync candles into existing series ────────────────────────────────── */

  useEffect(() => {
    candlesRef.current = candles;
    const chart = chartRef.current;
    const bundle = seriesRef.current;
    if (!chart || !bundle.main || !ready) return;

    const colors = getChartTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const config = useTerminal.getState().indicators;

    if (chartType === "candles" || chartType === "bars") {
      (bundle.main as ISeriesApi<"Candlestick">).setData(
        candles.map((candle) => ({
          time: candle.time as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })),
      );
    } else {
      (bundle.main as ISeriesApi<"Line">).setData(
        candles.map((candle) => ({ time: candle.time as UTCTimestamp, value: candle.close })),
      );
    }

    if (bundle.volume) {
      bundle.volume.setData(
        candles.map((candle) => ({
          time: candle.time as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? colors.volumeUp : colors.volumeDown,
        })),
      );
    }
    if (bundle.sma) bundle.sma.setData(sma(candles, config.sma.period).map(toLineData));
    if (bundle.ema) bundle.ema.setData(ema(candles, config.ema.period).map(toLineData));
    if (bundle.bbUpper && bundle.bbMiddle && bundle.bbLower) {
      const bands = bollingerBands(candles, config.bb.period, config.bb.stdDev);
      bundle.bbUpper.setData(bands.upper.map(toLineData));
      bundle.bbMiddle.setData(bands.middle.map(toLineData));
      bundle.bbLower.setData(bands.lower.map(toLineData));
    }
    if (bundle.rsi) bundle.rsi.setData(rsi(candles, config.rsi.period).map(toLineData));
    if (bundle.macdLine && bundle.macdSignal && bundle.macdHistogram) {
      const result = macd(candles, config.macd.fast, config.macd.slow, config.macd.signal);
      bundle.macdLine.setData(result.macd.map(toLineData));
      bundle.macdSignal.setData(result.signal.map(toLineData));
      bundle.macdHistogram.setData(
        result.histogram.map((point) => ({
          time: point.time as UTCTimestamp,
          value: point.value,
          color: point.positive ? colors.volumeUp : colors.volumeDown,
        })),
      );
    }

    setViewTick((tick) => tick + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles, chartType, ready]);

  /* ── Fit content on symbol / timeframe change ─────────────────────────── */

  const fittedRef = useRef<string>("");
  useEffect(() => {
    if (!candles.length) return;
    if (data?.symbol !== symbol || data?.timeframe !== timeframe) return;
    const key = `${symbol}:${timeframe}`;
    if (fittedRef.current === key) return;
    fittedRef.current = key;
    chartRef.current?.timeScale().fitContent();
    setLegendCandle(null);
    setViewTick((tick) => tick + 1);
  }, [candles, data?.symbol, data?.timeframe, symbol, timeframe]);

  /* ── Apply visual preferences live ────────────────────────────────────── */

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: theme.text,
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: chartGrid, color: theme.grid },
        horzLines: { visible: chartGrid, color: theme.grid },
      },
      crosshair: {
        mode: chartCrosshair ? CrosshairMode.Normal : CrosshairMode.Hidden,
        vertLine: { color: theme.crosshair, labelBackgroundColor: theme.brand },
        horzLine: { color: theme.crosshair, labelBackgroundColor: theme.brand },
      },
    });
    chart.priceScale("right").applyOptions({ borderColor: "hsl(var(--border))" });
    setViewTick((tick) => tick + 1);
  }, [chartGrid, chartCrosshair, theme]);

  /* ── Reset draft when tool changes ────────────────────────────────────── */

  useEffect(() => {
    setDraft(null);
    setPreview(null);
  }, [activeTool]);

  /* ── Drawing pointer handlers ─────────────────────────────────────────── */

  const completeDrawing = useCallback(
    (points: DrawingPoint[]) => {
      const tool = useTerminal.getState().activeTool;
      if (tool === "cursor") return;
      addDrawing({
        type: tool,
        points,
        color: useTerminal.getState().drawingColor,
        lineWidth: 2,
      });
      setDraft(null);
      setPreview(null);
    },
    [addDrawing],
  );

  const handleOverlayClick = (event: React.MouseEvent) => {
    const tool = useTerminal.getState().activeTool;
    if (tool === "cursor") return;
    const pixel = panePoint(event);
    const point = toPoint(pixel.x, pixel.y);
    if (!point) return;

    if (tool === "horizontal" || tool === "vertical") {
      completeDrawing([point]);
      return;
    }
    if (tool === "text") {
      setTextPoint(point);
      setTextValue("");
      return;
    }

    if (!draft) {
      setDraft([point, point]);
      setPreview(point);
      return;
    }
    completeDrawing([draft[0], point]);
  };

  const handleOverlayMove = (event: React.PointerEvent) => {
    if (!draft) return;
    const pixel = panePoint(event);
    const point = toPoint(pixel.x, pixel.y);
    if (point) setPreview(point);
  };

  const handleHandleDrag = (
    event: React.PointerEvent,
    drawing: DrawingShape,
    pointIndex: number,
  ) => {
    event.stopPropagation();
    event.preventDefault();
    const target = event.currentTarget as SVGCircleElement;
    target.setPointerCapture(event.pointerId);
    const move = (moveEvent: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const point = toPoint(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top);
      if (!point) return;
      const points = drawing.points.map((entry, index) => (index === pointIndex ? point : entry));
      updateDrawing(drawing.id, { points });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const submitText = (event: React.FormEvent) => {
    event.preventDefault();
    if (!textPoint) return;
    const value = textValue.trim();
    if (value) {
      addDrawing({
        type: "text",
        points: [textPoint],
        color: useTerminal.getState().drawingColor,
        lineWidth: 2,
        text: value,
      });
    }
    setTextPoint(null);
    setTextValue("");
  };

  /* ── Series metadata for legend ───────────────────────────────────────── */

  const indicatorReadout = useMemo(() => {
    if (!candles.length) return null;
    const values: Array<{ label: string; value: string; color: string }> = [];
    if (indicators.sma.enabled) {
      const value = lastValue(sma(candles, indicators.sma.period));
      if (value !== undefined) values.push({ label: `SMA ${indicators.sma.period}`, value: formatPrice(value, asset), color: indicators.sma.color });
    }
    if (indicators.ema.enabled) {
      const value = lastValue(ema(candles, indicators.ema.period));
      if (value !== undefined) values.push({ label: `EMA ${indicators.ema.period}`, value: formatPrice(value, asset), color: indicators.ema.color });
    }
    if (indicators.rsi.enabled) {
      const value = lastValue(rsi(candles, indicators.rsi.period));
      if (value !== undefined) values.push({ label: `RSI ${indicators.rsi.period}`, value: value.toFixed(1), color: theme.rsi });
    }
    return values;
  }, [candles, indicators, asset, theme.rsi]);

  const mainPaneHeight = paneHeight || containerRef.current?.clientHeight || 0;
  const selectedPixels = selectedDrawing ? selectedDrawing.points.map(toPixel) : [];

  void viewTick;
  void ready;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface", className)}>
      <div ref={containerRef} className="relative min-h-[240px] flex-1">
        {displayCandle && (
          <div className="pointer-events-none absolute left-3 top-2.5 z-10 flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-2xs text-muted">
              <span>
                <span className="text-subtle">O</span>{" "}
                <span className="text-foreground">{formatPrice(displayCandle.open, asset)}</span>
              </span>
              <span>
                <span className="text-subtle">H</span>{" "}
                <span className="text-foreground">{formatPrice(displayCandle.high, asset)}</span>
              </span>
              <span>
                <span className="text-subtle">L</span>{" "}
                <span className="text-foreground">{formatPrice(displayCandle.low, asset)}</span>
              </span>
              <span>
                <span className="text-subtle">C</span>{" "}
                <span className={displayCandle.close >= displayCandle.open ? "text-bullish" : "text-bearish"}>
                  {formatPrice(displayCandle.close, asset)}
                </span>
              </span>
              <span className="hidden items-center gap-1 text-subtle sm:flex">
                <span className="h-2.5 w-px bg-border-strong" />
                {formatDateTime(displayCandle.time * 1000)}
              </span>
            </div>
            {indicatorReadout && indicatorReadout.length > 0 && (
              <div className="hidden flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-3xs text-subtle md:flex">
                {indicatorReadout.map((entry) => (
                  <span key={entry.label} className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
                    {entry.label} <span className="text-muted">{entry.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="absolute bottom-8 left-3 z-10 flex items-center gap-2 text-3xs text-subtle">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium",
              data?.source === "demo" ? "bg-warning/10 text-warning" : "bg-bullish/10 text-bullish",
            )}
          >
            {data?.source === "demo" ? "DEMO DATA" : (data?.source ?? "demo").toUpperCase()}
          </span>
          <span className="hidden sm:inline">{data?.provider ?? "Meridian Simulation"}</span>
          {data?.timestamp ? <span className="hidden md:inline">· {formatDateTime(data.timestamp)}</span> : null}
        </div>

        <svg
          className="absolute inset-0 z-[8] h-full w-full"
          style={{
            pointerEvents: activeTool === "cursor" ? "none" : "auto",
            cursor: activeTool === "cursor" ? "default" : "crosshair",
          }}
          onClick={handleOverlayClick}
          onPointerMove={handleOverlayMove}
          aria-hidden
        >
          <defs>
            <clipPath id="meridian-main-pane-clip">
              <rect x="0" y="0" width="100%" height={mainPaneHeight} />
            </clipPath>
          </defs>
          <g clipPath="url(#meridian-main-pane-clip)">
            {drawings.map((drawing) => (
              <DrawingShapeView
                key={drawing.id}
                drawing={drawing}
                toPixel={toPixel}
                selected={drawing.id === selectedDrawingId}
                assetDecimals={assetDecimals}
              />
            ))}
            {draft && draft[0] && preview && (
              <DrawingShapeView
                drawing={{
                  id: "draft",
                  type: activeTool === "cursor" ? "trendline" : activeTool,
                  points: [draft[0], preview],
                  color: drawingColor,
                  lineWidth: 2 as const,
                  createdAt: 0,
                }}
                toPixel={toPixel}
                selected={false}
                ghost
                assetDecimals={assetDecimals}
              />
            )}
            {selectedDrawing &&
              selectedDrawing.points.map((point, index) => {
                const pixel = selectedPixels[index];
                if (!pixel) return null;
                return (
                  <circle
                    key={`${selectedDrawing.id}-handle-${index}`}
                    cx={pixel.x}
                    cy={pixel.y}
                    r={5}
                    fill="hsl(var(--surface))"
                    stroke={selectedDrawing.color}
                    strokeWidth={2}
                    style={{ pointerEvents: "auto", cursor: "grab" }}
                    onPointerDown={(event) => handleHandleDrag(event, selectedDrawing, index)}
                  />
                );
              })}
          </g>
        </svg>

        {(isLoading && !candles.length) || (isError && !candles.length) ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/70 backdrop-blur-[1px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-xs text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
                Loading {asset?.symbol ?? symbol} candles…
              </div>
            ) : (
              <div className="flex max-w-xs flex-col items-center gap-2 px-6 text-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="text-[13px] font-medium text-foreground">Chart data unavailable</p>
                <p className="text-xs text-muted">
                  {(error as Error | null)?.message ?? "The data provider did not return candles for this market."}
                </p>
                <Button size="sm" variant="secondary" className="mt-1" onClick={() => void refetch()}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        ) : null}

        {!isLoading && !isError && !candles.length ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="text-xs text-subtle">No candles for this timeframe.</p>
          </div>
        ) : null}

        {selectedDrawing && (
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-lg border border-border bg-elevated/95 p-1 text-2xs shadow-popover backdrop-blur">
            <span className="pl-1.5 font-medium text-foreground">{DRAWING_LABELS[selectedDrawing.type]}</span>
            <span className="flex items-center gap-1 border-l border-border pl-1.5">
              {["#5b8cff", "#1fc77f", "#f6465d", "#f0b90b", "#a78bfa", "#e2e8f0"].map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "h-4 w-4 rounded-full border transition-transform hover:scale-110",
                    selectedDrawing.color === color ? "border-foreground" : "border-transparent",
                  )}
                  style={{ background: color }}
                  aria-label={`Set drawing color ${color}`}
                  onClick={() => updateDrawing(selectedDrawing.id, { color })}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={() => {
                removeDrawing(selectedDrawing.id);
                selectDrawing(null);
              }}
              className="flex h-6 items-center gap-1 rounded px-1.5 text-muted transition-colors hover:bg-bearish/10 hover:text-bearish"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}
      </div>

      <Dialog open={Boolean(textPoint)} onOpenChange={(open) => !open && setTextPoint(null)}>
        <DialogContent className="max-w-sm">
          <form onSubmit={submitText}>
            <DialogHeader>
              <DialogTitle>Add text note</DialogTitle>
              <DialogDescription>
                The note is anchored to the chart at the price and time you selected.
              </DialogDescription>
            </DialogHeader>
            <Input
              autoFocus
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="e.g. Watch the 94k retest"
              maxLength={120}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={() => setTextPoint(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!textValue.trim()}>
                Add note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Drawing renderer ──────────────────────────────────────────────────── */

function DrawingShapeView({
  drawing,
  toPixel,
  selected,
  ghost = false,
  assetDecimals,
}: {
  drawing: DrawingShape;
  toPixel: (point: DrawingPoint) => PixelPoint | null;
  selected: boolean;
  ghost?: boolean;
  assetDecimals?: number;
}) {
  const pixelPoints = drawing.points.map(toPixel);
  if (pixelPoints.some((point) => !point)) return null;
  const points = pixelPoints as PixelPoint[];
  const stroke = drawing.color;
  const opacity = ghost ? 0.65 : 1;
  const width = selected ? drawing.lineWidth + 0.5 : drawing.lineWidth;
  const common = {
    stroke,
    strokeWidth: width,
    opacity,
    strokeDasharray: ghost ? "4 4" : undefined,
  };
  const labelPoint = (text: string, x: number, y: number) => (
    <g>
      <rect
        x={x + 4}
        y={y - 13}
        width={Math.max(28, text.length * 5.6 + 8)}
        height={14}
        rx={3}
        fill="hsl(var(--surface))"
        stroke={stroke}
        strokeOpacity={0.35}
        opacity={0.95}
      />
      <text x={x + 8} y={y - 3} fill={stroke} fontSize="9" fontFamily="JetBrains Mono Variable, monospace">
        {text}
      </text>
    </g>
  );

  if (drawing.type === "horizontal" && points[0]) {
    return (
      <g>
        <line x1={0} x2="100%" y1={points[0].y} y2={points[0].y} {...common} />
        {labelPoint(formatPrice(drawing.points[0].price, undefined, { decimals: assetDecimals }), 8, points[0].y)}
      </g>
    );
  }

  if (drawing.type === "vertical" && points[0]) {
    return (
      <g>
        <line x1={points[0].x} x2={points[0].x} y1={0} y2="100%" {...common} />
      </g>
    );
  }

  if (drawing.type === "trendline" && points[0] && points[1]) {
    return (
      <g>
        <line x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} {...common} />
        {selected && (
          <>
            <circle cx={points[0].x} cy={points[0].y} r={3.5} fill={stroke} />
            <circle cx={points[1].x} cy={points[1].y} r={3.5} fill={stroke} />
          </>
        )}
      </g>
    );
  }

  if (drawing.type === "rectangle" && points[0] && points[1]) {
    const x = Math.min(points[0].x, points[1].x);
    const y = Math.min(points[0].y, points[1].y);
    const rectWidth = Math.abs(points[1].x - points[0].x);
    const rectHeight = Math.abs(points[1].y - points[0].y);
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={rectWidth}
          height={rectHeight}
          fill={stroke}
          fillOpacity={ghost ? 0.06 : 0.09}
          stroke={stroke}
          strokeWidth={width}
          strokeOpacity={opacity}
        />
        {selected && (
          <>
            <circle cx={points[0].x} cy={points[0].y} r={3.5} fill={stroke} />
            <circle cx={points[1].x} cy={points[1].y} r={3.5} fill={stroke} />
          </>
        )}
      </g>
    );
  }

  if (drawing.type === "text" && points[0]) {
    const text = drawing.text ?? "Note";
    const textWidth = Math.max(40, text.length * 6.2 + 16);
    return (
      <g>
        <rect
          x={points[0].x}
          y={points[0].y - 12}
          width={textWidth}
          height={22}
          rx={4}
          fill="hsl(var(--surface))"
          fillOpacity={0.9}
          stroke={stroke}
          strokeOpacity={selected ? 0.9 : 0.4}
          strokeWidth={selected ? 1.5 : 1}
        />
        <text
          x={points[0].x + 8}
          y={points[0].y + 3}
          fill={stroke}
          fontSize="10"
          fontFamily="Inter Variable, sans-serif"
          fontWeight={500}
        >
          {text.length > 28 ? `${text.slice(0, 27)}…` : text}
        </text>
      </g>
    );
  }

  if (drawing.type === "fib" && points[0] && points[1]) {
    const top = Math.min(points[0].y, points[1].y);
    const bottom = Math.max(points[0].y, points[1].y);
    const left = Math.min(points[0].x, points[1].x);
    const right = Math.max(points[0].x, points[1].x);
    const high = Math.max(drawing.points[0].price, drawing.points[1].price);
    const low = Math.min(drawing.points[0].price, drawing.points[1].price);
    return (
      <g>
        <rect
          x={left}
          y={top}
          width={right - left}
          height={bottom - top}
          fill={stroke}
          fillOpacity={ghost ? 0.02 : 0.035}
        />
        {FIB_LEVELS.map((level, index) => {
          const y = top + (bottom - top) * level;
          const price = high - (high - low) * level;
          return (
            <g key={level}>
              <line
                x1={left}
                x2={right}
                y1={y}
                y2={y}
                stroke={stroke}
                strokeWidth={index === 0 || index === FIB_LEVELS.length - 1 ? 1.5 : 1}
                strokeOpacity={opacity * 0.85}
                strokeDasharray={index === 0 || index === FIB_LEVELS.length - 1 ? undefined : "3 3"}
              />
              <text
                x={left + 4}
                y={y - 3}
                fill={stroke}
                fillOpacity={0.9}
                fontSize="9"
                fontFamily="JetBrains Mono Variable, monospace"
              >
                {level === 0 || level === 1 ? level.toFixed(0) : level.toFixed(3)} ·{" "}
                {formatPrice(price, undefined, { decimals: assetDecimals })}
              </text>
            </g>
          );
        })}
      </g>
    );
  }

  return null;
}

function toLineData(point: { time: number; value: number }): LineData {
  return { time: point.time as UTCTimestamp, value: point.value };
}

export type { CandlestickData, HistogramData, Logical };

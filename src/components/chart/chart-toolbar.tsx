"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  BarChart3,
  Camera,
  Check,
  ChevronDown,
  Crosshair,
  Expand,
  LineChart,
  Minimize2,
  PanelRight,
  PanelRightClose,
  RotateCcw,
  Settings2,
  SlidersHorizontal,
  CandlestickChart,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TIMEFRAMES, type ChartType } from "@/lib/market/types";
import {
  INDICATOR_META,
  useTerminal,
  type IndicatorId,
  type PriceScaleMode,
} from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const CHART_TYPES: Array<{ id: ChartType; label: string; icon: LucideIcon }> = [
  { id: "candles", label: "Candles", icon: CandlestickChart },
  { id: "bars", label: "Bars", icon: BarChart3 },
  { id: "line", label: "Line", icon: LineChart },
  { id: "area", label: "Area", icon: AreaChart },
];

const SCALE_MODES: Array<{ id: PriceScaleMode; label: string; hint: string }> = [
  { id: "normal", label: "Linear", hint: "Absolute price scale" },
  { id: "logarithmic", label: "Logarithmic", hint: "Proportional price scale" },
  { id: "percentage", label: "Percentage", hint: "Change from first bar" },
];

const INDICATOR_ORDER: IndicatorId[] = ["sma", "ema", "bb", "volume", "rsi", "macd"];

export function ChartToolbar() {
  const timeframe = useTerminal((state) => state.timeframe);
  const setTimeframe = useTerminal((state) => state.setTimeframe);
  const chartType = useTerminal((state) => state.chartType);
  const setChartType = useTerminal((state) => state.setChartType);
  const priceScaleMode = useTerminal((state) => state.priceScaleMode);
  const setPriceScaleMode = useTerminal((state) => state.setPriceScaleMode);
  const indicators = useTerminal((state) => state.indicators);
  const toggleIndicator = useTerminal((state) => state.toggleIndicator);
  const resetIndicators = useTerminal((state) => state.resetIndicators);
  const rightPanelOpen = useTerminal((state) => state.rightPanelOpen);
  const toggleRightPanel = useTerminal((state) => state.toggleRightPanel);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const activeChart = CHART_TYPES.find((entry) => entry.id === chartType) ?? CHART_TYPES[0];
  const activeCount = INDICATOR_ORDER.filter((id) => indicators[id].enabled).length;

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const target = document.getElementById("meridian-chart-pane");
        await target?.requestFullscreen();
      }
    } catch {
      toast.error("Fullscreen is not available in this browser.");
    }
  };

  const resetChart = () => {
    window.dispatchEvent(new CustomEvent("meridian:reset-chart"));
    toast.message("Chart view reset", { duration: 1200 });
  };

  const screenshot = () => {
    window.dispatchEvent(new CustomEvent("meridian:screenshot-chart"));
  };

  return (
    <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface/60 px-2">
      <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="shrink-0 gap-1 px-2 text-muted">
              <activeChart.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{activeChart.label}</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuLabel>Chart style</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
              {CHART_TYPES.map((entry) => (
                <DropdownMenuRadioItem key={entry.id} value={entry.id}>
                  <entry.icon className="mr-1.5 h-3.5 w-3.5" />
                  {entry.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />

        <div className="flex shrink-0 items-center gap-0.5">
          {TIMEFRAMES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTimeframe(entry.id)}
              className={cn(
                "h-6 min-w-[26px] rounded px-1.5 font-mono text-2xs transition-colors",
                timeframe === entry.id
                  ? "bg-brand/15 font-semibold text-brand"
                  : "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
                entry.id === "1m" || entry.id === "5m" ? "hidden xl:block" : "",
              )}
              aria-pressed={timeframe === entry.id}
              title={`${entry.label} timeframe`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="shrink-0 gap-1 px-2 text-muted">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Indicators</span>
              <span className="rounded bg-foreground/[0.07] px-1 font-mono text-3xs text-muted">{activeCount}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Overlays & studies</DropdownMenuLabel>
            {INDICATOR_ORDER.map((id) => {
              const meta = INDICATOR_META[id];
              return (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={indicators[id].enabled}
                  onCheckedChange={() => toggleIndicator(id)}
                  onSelect={(event) => event.preventDefault()}
                >
                  <span className="flex flex-1 items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
                    <span className="flex-1">
                      <span className="block text-[13px] leading-tight">{meta.label}</span>
                      <span className="block text-3xs text-subtle">{meta.pane ? "Lower pane" : "Price overlay"}</span>
                    </span>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setSettingsOpen(true)}>
              <Settings2 />
              Configure indicators
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                resetIndicators();
                toast.message("Indicators reset to defaults");
              }}
            >
              <RotateCcw />
              Reset indicators
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="xs" className="hidden shrink-0 gap-1 px-2 text-muted sm:flex">
              <span className="font-mono text-2xs uppercase">{priceScaleMode.slice(0, 3)}</span>
              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Price scale</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={priceScaleMode}
              onValueChange={(value) => setPriceScaleMode(value as PriceScaleMode)}
            >
              {SCALE_MODES.map((entry) => (
                <DropdownMenuRadioItem key={entry.id} value={entry.id}>
                  <span className="flex flex-col">
                    <span>{entry.label}</span>
                    <span className="text-3xs text-subtle">{entry.hint}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={toggleRightPanel}
              aria-label={rightPanelOpen ? "Hide watchlist panel" : "Show watchlist panel"}
              className="hidden md:flex"
            >
              {rightPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRight className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{rightPanelOpen ? "Hide side panel" : "Show side panel"}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={resetChart} aria-label="Reset chart view">
              <Crosshair className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset zoom (Shift+R)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={screenshot} aria-label="Download chart snapshot">
              <Camera className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download snapshot</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{isFullscreen ? "Exit fullscreen" : "Fullscreen chart"}</TooltipContent>
        </Tooltip>
      </div>

      <IndicatorSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function SettingRow({
  label,
  value,
  children,
  suffix,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-2xs">
        <span className="text-muted">{label}</span>
        <span className="tnum font-mono text-foreground">
          {value}
          {suffix}
        </span>
      </div>
      {children}
    </div>
  );
}

function IndicatorSettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const indicators = useTerminal((state) => state.indicators);
  const updateIndicator = useTerminal((state) => state.updateIndicator);
  const toggleIndicator = useTerminal((state) => state.toggleIndicator);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Indicator settings</DialogTitle>
          <DialogDescription>
            Tune study periods. Changes apply to the chart immediately and are saved on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          <section className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">SMA</p>
                <p className="text-2xs text-subtle">Simple moving average overlay</p>
              </div>
              <Switch
                checked={indicators.sma.enabled}
                onCheckedChange={() => toggleIndicator("sma")}
                aria-label="Toggle SMA"
              />
            </div>
            <SettingRow label="Period" value={String(indicators.sma.period)}>
              <Slider
                min={2}
                max={200}
                step={1}
                value={[indicators.sma.period]}
                onValueChange={([value]) => updateIndicator("sma", { period: value })}
                disabled={!indicators.sma.enabled}
              />
            </SettingRow>
          </section>

          <section className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">EMA</p>
                <p className="text-2xs text-subtle">Exponential moving average overlay</p>
              </div>
              <Switch
                checked={indicators.ema.enabled}
                onCheckedChange={() => toggleIndicator("ema")}
                aria-label="Toggle EMA"
              />
            </div>
            <SettingRow label="Period" value={String(indicators.ema.period)}>
              <Slider
                min={2}
                max={200}
                step={1}
                value={[indicators.ema.period]}
                onValueChange={([value]) => updateIndicator("ema", { period: value })}
                disabled={!indicators.ema.enabled}
              />
            </SettingRow>
          </section>

          <section className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">Bollinger Bands</p>
                <p className="text-2xs text-subtle">Volatility envelope</p>
              </div>
              <Switch
                checked={indicators.bb.enabled}
                onCheckedChange={() => toggleIndicator("bb")}
                aria-label="Toggle Bollinger Bands"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SettingRow label="Period" value={String(indicators.bb.period)}>
                <Slider
                  min={5}
                  max={60}
                  step={1}
                  value={[indicators.bb.period]}
                  onValueChange={([value]) => updateIndicator("bb", { period: value })}
                  disabled={!indicators.bb.enabled}
                />
              </SettingRow>
              <SettingRow label="Std dev" value={indicators.bb.stdDev.toFixed(1)}>
                <Slider
                  min={1}
                  max={4}
                  step={0.1}
                  value={[indicators.bb.stdDev]}
                  onValueChange={([value]) => updateIndicator("bb", { stdDev: Number(value.toFixed(1)) })}
                  disabled={!indicators.bb.enabled}
                />
              </SettingRow>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">RSI</p>
                <p className="text-2xs text-subtle">Momentum oscillator pane</p>
              </div>
              <Switch
                checked={indicators.rsi.enabled}
                onCheckedChange={() => toggleIndicator("rsi")}
                aria-label="Toggle RSI"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SettingRow label="Period" value={String(indicators.rsi.period)}>
                <Slider
                  min={2}
                  max={40}
                  step={1}
                  value={[indicators.rsi.period]}
                  onValueChange={([value]) => updateIndicator("rsi", { period: value })}
                  disabled={!indicators.rsi.enabled}
                />
              </SettingRow>
              <SettingRow label="Overbought" value={String(indicators.rsi.overbought)}>
                <Slider
                  min={55}
                  max={95}
                  step={1}
                  value={[indicators.rsi.overbought]}
                  onValueChange={([value]) => updateIndicator("rsi", { overbought: value })}
                  disabled={!indicators.rsi.enabled}
                />
              </SettingRow>
              <SettingRow label="Oversold" value={String(indicators.rsi.oversold)}>
                <Slider
                  min={5}
                  max={45}
                  step={1}
                  value={[indicators.rsi.oversold]}
                  onValueChange={([value]) => updateIndicator("rsi", { oversold: value })}
                  disabled={!indicators.rsi.enabled}
                />
              </SettingRow>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">MACD</p>
                <p className="text-2xs text-subtle">Trend and momentum pane</p>
              </div>
              <Switch
                checked={indicators.macd.enabled}
                onCheckedChange={() => toggleIndicator("macd")}
                aria-label="Toggle MACD"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SettingRow label="Fast" value={String(indicators.macd.fast)}>
                <Slider
                  min={2}
                  max={40}
                  step={1}
                  value={[indicators.macd.fast]}
                  onValueChange={([value]) => updateIndicator("macd", { fast: value })}
                  disabled={!indicators.macd.enabled}
                />
              </SettingRow>
              <SettingRow label="Slow" value={String(indicators.macd.slow)}>
                <Slider
                  min={5}
                  max={80}
                  step={1}
                  value={[indicators.macd.slow]}
                  onValueChange={([value]) => updateIndicator("macd", { slow: value })}
                  disabled={!indicators.macd.enabled}
                />
              </SettingRow>
              <SettingRow label="Signal" value={String(indicators.macd.signal)}>
                <Slider
                  min={2}
                  max={30}
                  step={1}
                  value={[indicators.macd.signal]}
                  onValueChange={([value]) => updateIndicator("macd", { signal: value })}
                  disabled={!indicators.macd.enabled}
                />
              </SettingRow>
            </div>
          </section>

          <section className="flex items-center justify-between rounded-lg border border-border bg-surface-2/60 p-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">Volume</p>
              <p className="text-2xs text-subtle">Traded volume histogram</p>
            </div>
            <Switch
              checked={indicators.volume.enabled}
              onCheckedChange={() => toggleIndicator("volume")}
              aria-label="Toggle volume"
            />
          </section>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-2xs text-subtle">
          <span className="flex items-center gap-1">
            <Check className="h-3 w-3 text-bullish" />
            Saved automatically
          </span>
          <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Database,
  Gauge,
  Info,
  Keyboard,
  ListPlus,
  Monitor,
  Moon,
  Palette,
  Radio,
  RefreshCw,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Wallet,
  WifiOff,
  CandlestickChart,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/logo";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { CashDialog } from "@/components/portfolio/cash-dialog";
import { ListManagerDialog } from "@/components/watchlist/list-manager-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader, Stat } from "@/components/ui/page-header";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataStatus } from "@/hooks/use-market-data";
import { useResolvedTheme } from "@/hooks/use-theme";
import { formatCurrency, formatTimeAgo } from "@/lib/format";
import { TIMEFRAMES, type ChartType, type Timeframe } from "@/lib/market/types";
import { usePortfolio } from "@/stores/portfolio-store";
import { usePreferences, type ThemeMode } from "@/stores/preferences-store";
import { useTerminal } from "@/stores/terminal-store";
import { useUi } from "@/stores/ui-store";
import { useWatchlists } from "@/stores/watchlist-store";
import { cn } from "@/lib/utils";

const CHART_TYPES: Array<{ id: ChartType; label: string }> = [
  { id: "candles", label: "Candlestick" },
  { id: "bars", label: "OHLC bars" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
];

const THEME_OPTIONS: Array<{ id: ThemeMode; label: string; description: string; icon: LucideIcon }> = [
  { id: "dark", label: "Dark", description: "Low-glare terminal palette", icon: Moon },
  { id: "light", label: "Light", description: "Bright, high-contrast workspace", icon: Sun },
  { id: "system", label: "System", description: "Follow your OS appearance", icon: Monitor },
];

const STORAGE_KEYS = [
  "meridian.preferences",
  "meridian.terminal",
  "meridian.watchlists",
  "meridian.portfolio",
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedTheme = useResolvedTheme();
  const setShortcutsOpen = useUi((state) => state.setShortcutsOpen);

  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);
  const defaultTimeframe = usePreferences((state) => state.defaultTimeframe);
  const setDefaultTimeframe = usePreferences((state) => state.setDefaultTimeframe);
  const defaultChartType = usePreferences((state) => state.defaultChartType);
  const setDefaultChartType = usePreferences((state) => state.setDefaultChartType);
  const chartGrid = usePreferences((state) => state.chartGrid);
  const setChartGrid = usePreferences((state) => state.setChartGrid);
  const chartCrosshair = usePreferences((state) => state.chartCrosshair);
  const setChartCrosshair = usePreferences((state) => state.setChartCrosshair);
  const showSparklines = usePreferences((state) => state.showSparklines);
  const setShowSparklines = usePreferences((state) => state.setShowSparklines);
  const reduceMotion = usePreferences((state) => state.reduceMotion);
  const setReduceMotion = usePreferences((state) => state.setReduceMotion);
  const resetPreferences = usePreferences((state) => state.resetPreferences);

  const terminalTimeframe = useTerminal((state) => state.timeframe);
  const terminalChartType = useTerminal((state) => state.chartType);
  const setTimeframe = useTerminal((state) => state.setTimeframe);
  const setChartType = useTerminal((state) => state.setChartType);
  const liveUpdates = useTerminal((state) => state.liveUpdates);
  const setLiveUpdates = useTerminal((state) => state.setLiveUpdates);
  const resetIndicators = useTerminal((state) => state.resetIndicators);
  const currentSymbol = useTerminal((state) => state.symbol);
  const drawings = useTerminal((state) => state.drawings);
  const clearDrawings = useTerminal((state) => state.clearDrawings);

  const lists = useWatchlists((state) => state.lists);
  const activeListId = useWatchlists((state) => state.activeListId);
  const setActiveList = useWatchlists((state) => state.setActiveList);
  const restoreDefaultLists = useWatchlists((state) => state.restoreDefaults);

  const holdings = usePortfolio((state) => state.holdings);
  const cash = usePortfolio((state) => state.cash);
  const isSample = usePortfolio((state) => state.isSample);
  const restoreSamplePortfolio = usePortfolio((state) => state.restoreSamplePortfolio);
  const clearHoldings = usePortfolio((state) => state.clearHoldings);
  const setCash = usePortfolio((state) => state.setCash);

  const statusQuery = useDataStatus();
  const status = statusQuery.data;
  const dataMode = statusQuery.isError ? "demo" : status?.mode ?? "demo";

  const [manageListsOpen, setManageListsOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [clearPortfolioOpen, setClearPortfolioOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const drawingCount = drawings[currentSymbol]?.length ?? 0;
  const activeList = lists.find((list) => list.id === activeListId);

  const copy = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      toast.success(`${name} copied`);
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  };

  const refreshData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["market"] }),
      statusQuery.refetch(),
    ]);
    toast.success("Market data and provider status refreshed");
  };

  const applyChartDefaults = () => {
    setTimeframe(defaultTimeframe);
    setChartType(defaultChartType);
    toast.success(
      `Terminal set to ${defaultTimeframe} ${CHART_TYPES.find((entry) => entry.id === defaultChartType)?.label.toLowerCase()}`,
      {
        action: {
          label: "Open terminal",
          onClick: () => router.push("/"),
        },
      },
    );
  };

  const resetLocalData = () => {
    for (const key of STORAGE_KEYS) window.localStorage.removeItem(key);
    window.location.reload();
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Tune the terminal to your workflow. Preferences, watchlists, portfolio and chart defaults are stored locally in this browser."
        actions={
          <>
            <DataSourceBadge />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                resetPreferences();
                toast.success("Preferences restored to defaults");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset preferences
            </Button>
            <Button size="sm" asChild>
              <Link href="/">
                Open terminal
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="appearance" orientation="vertical" className="grid gap-4 lg:grid-cols-[188px_minmax(0,1fr)]">
        <TabsList
          className="no-scrollbar flex h-auto w-full flex-row items-stretch gap-0.5 overflow-x-auto p-1.5 lg:flex-col lg:overflow-visible"
          aria-label="Settings sections"
        >
          <TabsTrigger value="appearance" className="h-9 w-auto shrink-0 justify-start gap-2 px-2.5 lg:w-full">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="charts" className="h-9 w-auto shrink-0 justify-start gap-2 px-2.5 lg:w-full">
            <CandlestickChart className="h-3.5 w-3.5" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="data" className="h-9 w-auto shrink-0 justify-start gap-2 px-2.5 lg:w-full">
            <Database className="h-3.5 w-3.5" />
            Market data
          </TabsTrigger>
          <TabsTrigger value="workspace" className="h-9 w-auto shrink-0 justify-start gap-2 px-2.5 lg:w-full">
            <Star className="h-3.5 w-3.5" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="about" className="h-9 w-auto shrink-0 justify-start gap-2 px-2.5 lg:w-full">
            <Info className="h-3.5 w-3.5" />
            About
          </TabsTrigger>
        </TabsList>

        <div className="min-w-0">
          <TabsContent value="appearance" className="mt-0 space-y-4">
            <SettingsSection
              icon={Palette}
              title="Appearance"
              description="Choose a theme and motion preference. Meridian starts in dark mode and remembers your choice."
            >
              <div className="p-4">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {THEME_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = theme === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTheme(option.id)}
                        className={cn(
                          "group relative overflow-hidden rounded-lg border p-2 text-left transition-all",
                          active
                            ? "border-brand/50 bg-brand/[0.06] shadow-[0_0_0_1px_hsl(var(--brand)/0.18)]"
                            : "border-border bg-surface-2/30 hover:border-border-strong",
                        )}
                        aria-pressed={active}
                      >
                        <ThemePreview mode={option.id} />
                        <div className="mt-2 flex items-start gap-1.5 px-0.5">
                          <Icon className={cn("mt-0.5 h-3 w-3 shrink-0", active ? "text-brand" : "text-subtle")} />
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-2xs font-medium", active ? "text-brand" : "text-foreground")}>
                              {option.label}
                            </p>
                            <p className="truncate text-3xs text-subtle">{option.description}</p>
                          </div>
                          {active && <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-3xs text-subtle">
                  <Sparkles className="h-3 w-3" />
                  Resolved appearance: <span className="font-medium text-muted">{resolvedTheme}</span> · theme is applied
                  instantly and persisted locally.
                </p>
              </div>

              <SettingRow
                label="Reduce motion"
                description="Minimise animations and transitions across charts, dialogs and ticker tapes."
              >
                <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} aria-label="Reduce motion" />
              </SettingRow>
              <SettingRow
                label="Watchlist sparklines"
                description="Show miniature price paths beside instruments in watchlists and tables."
              >
                <Switch checked={showSparklines} onCheckedChange={setShowSparklines} aria-label="Show sparklines" />
              </SettingRow>
            </SettingsSection>

            <div className="panel grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
              <Stat label="Theme" value={theme} hint={`Rendering ${resolvedTheme}`} className="capitalize" />
              <Stat label="Motion" value={reduceMotion ? "Reduced" : "Full"} hint="Interface animation" />
              <Stat label="Sparklines" value={showSparklines ? "On" : "Off"} hint="Watchlist context" />
              <Stat label="Storage" value="Local" hint="No account required" tone="muted" />
            </div>
          </TabsContent>

          <TabsContent value="charts" className="mt-0 space-y-4">
            <SettingsSection
              icon={CandlestickChart}
              title="Chart defaults"
              description="Set the starting point for chart analysis. Apply the defaults to the live terminal at any time."
            >
              <SettingRow
                label="Default timeframe"
                description="Used when you apply chart defaults or reset your workspace."
              >
                <select
                  value={defaultTimeframe}
                  onChange={(event) => setDefaultTimeframe(event.target.value as Timeframe)}
                  className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
                  aria-label="Default timeframe"
                >
                  {TIMEFRAMES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </SettingRow>
              <SettingRow label="Default chart style" description="Candles, bars, line or area for new sessions.">
                <select
                  value={defaultChartType}
                  onChange={(event) => setDefaultChartType(event.target.value as ChartType)}
                  className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
                  aria-label="Default chart style"
                >
                  {CHART_TYPES.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                      {entry.id === defaultChartType ? " · default" : ""}
                    </option>
                  ))}
                </select>
              </SettingRow>
              <SettingRow
                label="Apply to terminal"
                description={`Terminal is currently ${terminalTimeframe} · ${CHART_TYPES.find((entry) => entry.id === terminalChartType)?.label.toLowerCase()}.`}
              >
                <Button size="sm" variant="secondary" onClick={applyChartDefaults}>
                  <Check className="h-3.5 w-3.5" />
                  Apply defaults
                </Button>
              </SettingRow>
              <SettingRow
                label="Reset indicators"
                description="Restore SMA, EMA and volume defaults, and disable RSI, MACD and Bollinger Bands."
              >
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    resetIndicators();
                    toast.success("Chart indicators reset");
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </Button>
              </SettingRow>
            </SettingsSection>

            <SettingsSection
              icon={SlidersHorizontal}
              title="Chart display"
              description="Control the visual guides drawn behind price action."
            >
              <SettingRow label="Price grid" description="Show horizontal and vertical grid lines on the chart.">
                <Switch checked={chartGrid} onCheckedChange={setChartGrid} aria-label="Show chart grid" />
              </SettingRow>
              <SettingRow label="Crosshair" description="Track the pointer across price and time axes.">
                <Switch checked={chartCrosshair} onCheckedChange={setChartCrosshair} aria-label="Show crosshair" />
              </SettingRow>
              <SettingRow
                label="Timeframes"
                description="The terminal supports nine ranges from one minute to one month."
              >
                <Badge variant="outline">{TIMEFRAMES.length} ranges</Badge>
              </SettingRow>
            </SettingsSection>
          </TabsContent>

          <TabsContent value="data" className="mt-0 space-y-4">
            <SettingsSection
              icon={Database}
              title="Market data"
              description="Meridian uses configured provider credentials when available and falls back to a deterministic simulation otherwise."
            >
              <div className="p-4">
                <div
                  className={cn(
                    "rounded-lg border p-3.5",
                    dataMode === "demo"
                      ? "border-warning/25 bg-warning/[0.045]"
                      : "border-brand/25 bg-brand/[0.045]",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                      {dataMode === "demo" ? (
                        <WifiOff className="h-3.5 w-3.5 text-warning" />
                      ) : (
                        <Radio className="h-3.5 w-3.5 text-brand" />
                      )}
                      {dataMode === "demo" ? "Demonstration mode" : "Provider mode"}
                      <Badge variant={dataMode === "demo" ? "warning" : "brand"}>{dataMode}</Badge>
                    </span>
                    <span className="flex items-center gap-1 text-3xs text-subtle">
                      <Clock3 className="h-3 w-3" />
                      {status ? `Checked ${formatTimeAgo(status.timestamp)}` : statusQuery.isLoading ? "Checking…" : "Unavailable"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-2xs leading-relaxed text-muted">
                    {statusQuery.isError
                      ? "The provider status endpoint is unreachable. The terminal will continue to simulate prices locally."
                      : status?.message ??
                        "Checking which market-data providers are configured. No keys are ever exposed to the browser."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="xs" variant="secondary" onClick={refreshData}>
                      <RefreshCw className={cn("h-3 w-3", statusQuery.isFetching && "animate-spin")} />
                      Refresh status
                    </Button>
                    <Button size="xs" variant="ghost" asChild>
                      <Link href="/markets">
                        Examine quotes
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {(status?.providers ?? [
                  {
                    name: "TWELVE_DATA_API_KEY",
                    label: "Twelve Data",
                    description: "Multi-asset quotes and time series for equities, FX, indices and crypto.",
                    configured: false,
                  },
                  {
                    name: "FINNHUB_API_KEY",
                    label: "Finnhub",
                    description: "US equity quotes and crypto candles. Stock candle history needs a paid plan.",
                    configured: false,
                  },
                  {
                    name: "COINGECKO_API_KEY",
                    label: "CoinGecko",
                    description: "Aggregated crypto prices, 24h stats and OHLC history.",
                    configured: false,
                  },
                  {
                    name: "MARKET_DATA_MODE",
                    label: "Force demo mode",
                    description: "Set to 'demo' to ignore provider credentials and always use simulated data.",
                    configured: false,
                  },
                ]).map((provider) => (
                  <div key={provider.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            provider.configured ? "bg-bullish" : "bg-border-strong",
                          )}
                        />
                        <p className="text-xs font-medium text-foreground">{provider.label}</p>
                        <Badge variant={provider.configured ? "bull" : "outline"}>
                          {provider.configured ? "Configured" : "Not set"}
                        </Badge>
                      </div>
                      <p className="mt-1 max-w-xl text-2xs leading-relaxed text-muted">{provider.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(provider.name)}
                      className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-3xs text-muted transition-colors hover:border-border-strong hover:text-foreground"
                      aria-label={`Copy ${provider.name}`}
                    >
                      {provider.name}
                      <Copy className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-4">
                <p className="text-2xs font-medium text-foreground">Configuring providers</p>
                <p className="mt-1 text-3xs leading-relaxed text-subtle">
                  Add keys to <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-muted">.env.local</code>{" "}
                  and restart the development server. Never commit credentials. The server routes proxy every request,
                  so keys stay out of the browser bundle. Set{" "}
                  <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-muted">MARKET_DATA_MODE=demo</code>{" "}
                  to force the simulation.
                </p>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Radio}
              title="Live updates"
              description="Polling keeps quotes fresh while you work. Disabling live updates is useful on metered connections."
            >
              <SettingRow
                label="Automatic quote refresh"
                description="Quotes refresh every 7 seconds and candles every 15 seconds while enabled."
              >
                <Switch checked={liveUpdates} onCheckedChange={setLiveUpdates} aria-label="Live quote updates" />
              </SettingRow>
              <SettingRow label="Refresh interval" description="Applied to snapshots, quotes and the ticker tape.">
                <Badge variant="outline">7 s</Badge>
              </SettingRow>
              <SettingRow label="Data attribution" description="Every quote, candle and sparkline carries a source label.">
                <Button size="xs" variant="ghost" asChild>
                  <Link href="/markets">View sources</Link>
                </Button>
              </SettingRow>
            </SettingsSection>
          </TabsContent>

          <TabsContent value="workspace" className="mt-0 space-y-4">
            <SettingsSection
              icon={ListPlus}
              title="Watchlists"
              description="Organize tracked instruments into lists. The active list drives the terminal side panel."
            >
              <div className="divide-y divide-border">
                {lists.map((list) => (
                  <div key={list.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <span className="truncate">{list.name}</span>
                        {list.id === activeListId && <Badge variant="brand">Active</Badge>}
                      </p>
                      <p className="mt-0.5 text-2xs text-subtle">{list.symbols.length} instruments</p>
                    </div>
                    <Button
                      size="xs"
                      variant={list.id === activeListId ? "ghost" : "secondary"}
                      disabled={list.id === activeListId}
                      onClick={() => {
                        setActiveList(list.id);
                        toast.success(`${list.name} is now the active watchlist`);
                      }}
                    >
                      {list.id === activeListId ? "In use" : "Make active"}
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
                <div>
                  <p className="text-2xs font-medium text-foreground">Active list</p>
                  <p className="text-3xs text-subtle">{activeList?.name ?? "None"} · changes are saved automatically</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setManageListsOpen(true)}>
                    <Settings2 className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      restoreDefaultLists();
                      toast.success("Default watchlists restored");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore defaults
                  </Button>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Wallet}
              title="Portfolio"
              description="Positions and cash are local records for tracking and analysis. No brokerage connection exists."
            >
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Positions" value={holdings.length} hint={isSample ? "Sample data" : "Your data"} />
                  <Stat label="Cash" value={formatCurrency(cash)} hint="Marked manually" />
                  <Stat label="Status" value={isSample ? "Sample" : holdings.length ? "Custom" : "Empty"} hint="Local portfolio" />
                  <Stat label="Currency" value="USD" hint="Valuation currency" tone="muted" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setCashOpen(true)}>
                    Adjust cash
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      restoreSamplePortfolio();
                      toast.success("Sample portfolio restored");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore sample
                  </Button>
                  <Button
                    size="sm"
                    variant="danger-ghost"
                    disabled={!holdings.length}
                    onClick={() => setClearPortfolioOpen(true)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear positions
                  </Button>
                  <Button size="sm" variant="ghost" asChild className="ml-auto">
                    <Link href="/portfolio">
                      Open portfolio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              icon={Gauge}
              title="Local workspace"
              description="Chart drawings and workspace state are kept on this device."
            >
              <SettingRow
                label="Drawing objects"
                description={`${drawingCount} drawing${drawingCount === 1 ? "" : "s"} on ${currentSymbol}.`}
              >
                <Button
                  size="xs"
                  variant="danger-ghost"
                  disabled={!drawingCount}
                  onClick={() => {
                    clearDrawings();
                    toast.success("Drawings cleared for the current symbol");
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  Clear drawings
                </Button>
              </SettingRow>
              <SettingRow
                label="Keyboard shortcuts"
                description="Learn chart, drawing and workspace shortcuts."
              >
                <Button size="xs" variant="secondary" onClick={() => setShortcutsOpen(true)}>
                  <Keyboard className="h-3 w-3" />
                  View shortcuts
                </Button>
              </SettingRow>
              <SettingRow
                label="Reset all local data"
                description="Remove preferences, watchlists, portfolio and drawings from this browser, then reload."
              >
                <Button size="xs" variant="danger" onClick={() => setResetOpen(true)}>
                  <Trash2 className="h-3 w-3" />
                  Reset data
                </Button>
              </SettingRow>
            </SettingsSection>
          </TabsContent>

          <TabsContent value="about" className="mt-0 space-y-4">
            <section className="panel overflow-hidden">
              <div className="flex flex-col gap-4 bg-gradient-to-br from-brand/[0.09] via-surface to-surface p-5 sm:flex-row sm:items-center">
                <LogoMark className="h-12 w-12 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">Meridian Terminal</h2>
                  <p className="mt-0.5 text-xs text-muted">
                    A local-first market analysis workspace with interactive charts, watchlists and portfolio tracking.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant="brand">Version 0.1.0</Badge>
                    <Badge variant="outline">Next.js 15</Badge>
                    <Badge variant="outline">React 19</Badge>
                    <Badge variant="outline">Lightweight Charts 5</Badge>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link href="/">
                    Launch terminal
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-3">
                <div>
                  <p className="label-caps">Data</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground">
                    <Server className="h-3.5 w-3.5 text-subtle" />
                    {status?.mode === "demo" ? "Demonstration" : "Provider-backed"}
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">
                    {status?.configured.length
                      ? `${status.configured.length} provider${status.configured.length === 1 ? "" : "s"} configured`
                      : "No provider keys configured"}
                  </p>
                </div>
                <div>
                  <p className="label-caps">Storage</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-subtle" />
                    Browser local storage
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">No account, no cloud sync</p>
                </div>
                <div>
                  <p className="label-caps">Profile</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-subtle" />
                    Local profile
                  </p>
                  <p className="mt-0.5 text-2xs text-subtle">Alex Morgan · demo identity</p>
                </div>
              </div>
            </section>

            <SettingsSection
              icon={ShieldCheck}
              title="Disclosures"
              description="What this build does and does not do."
            >
              <div className="space-y-3 p-4 text-2xs leading-relaxed text-muted">
                <p>
                  <span className="font-medium text-foreground">Market data.</span> With no provider credentials,
                  all prices, candles, sparklines and market status are generated locally by a deterministic
                  simulation engine. They are clearly labelled as demonstration data throughout the app and must
                  not be used for trading.
                </p>
                <p>
                  <span className="font-medium text-foreground">News.</span> The newsroom contains fictional
                  demonstration stories. Sources, authors and events are invented.
                </p>
                <p>
                  <span className="font-medium text-foreground">Portfolio.</span> Positions are manual entries.
                  There is no brokerage integration, order routing, custody or execution. Valuations are
                  indicative estimates based on the current quote source.
                </p>
                <p>
                  <span className="font-medium text-foreground">Privacy.</span> Preferences, watchlists, portfolio
                  records and drawings never leave your browser. Provider API keys are read only by server routes
                  and are never sent to the client.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
                <div>
                  <p className="text-2xs font-medium text-foreground">Need a refresher?</p>
                  <p className="text-3xs text-subtle">Open the keyboard shortcut reference.</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setShortcutsOpen(true)}>
                  <Keyboard className="h-3.5 w-3.5" />
                  Keyboard shortcuts
                </Button>
              </div>
            </SettingsSection>
          </TabsContent>
        </div>
      </Tabs>

      <p className="pb-2 text-3xs leading-relaxed text-subtle">
        Meridian Terminal is a product demonstration. Market data may be simulated or delayed. Nothing in this
        application constitutes financial advice.
      </p>

      <ListManagerDialog open={manageListsOpen} onOpenChange={setManageListsOpen} />
      <CashDialog
        open={cashOpen}
        onOpenChange={setCashOpen}
        current={cash}
        onSave={(value) => {
          setCash(value);
          toast.success(`Cash balance set to ${formatCurrency(value)}`);
        }}
      />
      <Dialog open={clearPortfolioOpen} onOpenChange={setClearPortfolioOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear all positions?</DialogTitle>
            <DialogDescription>
              Every position will be removed from this browser. Your cash balance is kept. This cannot be undone
              from settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setClearPortfolioOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                clearHoldings();
                setClearPortfolioOpen(false);
                toast.success("Portfolio positions cleared");
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear positions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset all local data?</DialogTitle>
            <DialogDescription>
              This removes your preferences, watchlists, portfolio and chart drawings from this browser, then
              reloads the app. Provider credentials and server configuration are unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={resetLocalData}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset and reload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-muted">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-0.5 text-2xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="mt-0.5 max-w-xl text-2xs leading-relaxed text-subtle">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}

function ThemePreview({ mode }: { mode: ThemeMode }) {
  if (mode === "system") {
    return (
      <div className="flex h-[68px] overflow-hidden rounded-md border border-black/10">
        <div className="flex-1 bg-[#f4f6f9] p-1.5">
          <div className="h-1 w-6 rounded bg-[#c7ced9]" />
          <div className="mt-1 h-1 w-4 rounded bg-[#d8dee7]" />
          <div className="mt-2 h-4 rounded bg-white" />
        </div>
        <div className="flex-1 border-l border-black/10 bg-[#0b0e13] p-1.5">
          <div className="h-1 w-6 rounded bg-[#2b323d]" />
          <div className="mt-1 h-1 w-4 rounded bg-[#222831]" />
          <div className="mt-2 h-4 rounded bg-[#151a21]" />
        </div>
      </div>
    );
  }

  const dark = mode === "dark";
  return (
    <div
      className={cn(
        "h-[68px] overflow-hidden rounded-md border p-1.5",
        dark ? "border-black/40 bg-[#0b0e13]" : "border-black/10 bg-[#f4f6f9]",
      )}
    >
      <div className="flex h-full gap-1.5">
        <div className={cn("w-4 rounded-sm", dark ? "bg-[#1a1f27]" : "bg-[#e3e8ef]")} />
        <div className="flex-1">
          <div className={cn("h-1.5 w-3/4 rounded", dark ? "bg-[#2b323d]" : "bg-[#c7ced9]")} />
          <div className={cn("mt-1 h-1.5 w-1/2 rounded", dark ? "bg-[#222831]" : "bg-[#d8dee7]")} />
          <div className={cn("mt-2 h-6 rounded-sm", dark ? "bg-[#151a21]" : "bg-white")}>
            <svg viewBox="0 0 80 24" className="h-full w-full" aria-hidden>
              <path
                d="M2 18 L14 15 L22 17 L32 10 L41 12 L52 7 L63 9 L76 4"
                fill="none"
                stroke={dark ? "#5b8cff" : "#2f6bff"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

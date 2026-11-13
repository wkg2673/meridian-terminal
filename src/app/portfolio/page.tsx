"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowDownUp,
  ChevronRight,
  Coins,
  Info,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { CashDialog } from "@/components/portfolio/cash-dialog";
import { HoldingDialog } from "@/components/portfolio/holding-dialog";
import { PortfolioPerformance } from "@/components/portfolio/portfolio-performance";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, Stat } from "@/components/ui/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { usePortfolioMetrics, type PositionMetrics } from "@/hooks/use-portfolio";
import { formatCurrency, formatPercent, formatPrice, formatQuantity } from "@/lib/format";
import { usePortfolio, type Holding } from "@/stores/portfolio-store";
import { usePreferences } from "@/stores/preferences-store";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

type SortMode = "value" | "day" | "pnl" | "symbol";
type ClearMode = "sample" | "all" | null;

const SORT_LABELS: Record<SortMode, string> = {
  value: "Market value",
  day: "Day P/L",
  pnl: "Total P/L",
  symbol: "Symbol A–Z",
};

function signedCurrency(value: number): string {
  return `${value >= 0 ? "+" : "−"}${formatCurrency(Math.abs(value))}`;
}

function signedPercent(value: number, decimals = 2): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(decimals)}%`;
}

export default function PortfolioPage() {
  const router = useRouter();
  const hydrated = usePortfolio((state) => state.hydrated);
  const isSample = usePortfolio((state) => state.isSample);
  const holdings = usePortfolio((state) => state.holdings);
  const cash = usePortfolio((state) => state.cash);
  const addHolding = usePortfolio((state) => state.addHolding);
  const removeHolding = usePortfolio((state) => state.removeHolding);
  const clearHoldings = usePortfolio((state) => state.clearHoldings);
  const restoreSamplePortfolio = usePortfolio((state) => state.restoreSamplePortfolio);
  const setCash = usePortfolio((state) => state.setCash);
  const setSymbol = useTerminal((state) => state.setSymbol);
  const showSparklines = usePreferences((state) => state.showSparklines);

  const metrics = usePortfolioMetrics();
  const [sort, setSort] = useState<SortMode>("value");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Holding | undefined>();
  const [cashOpen, setCashOpen] = useState(false);
  const [clearMode, setClearMode] = useState<ClearMode>(null);

  const totalValue = metrics.totals.totalValue;
  const positions = metrics.positions;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = positions.filter((position) => {
      if (!needle) return true;
      return (
        (position.asset?.symbol ?? position.holding.symbol).toLowerCase().includes(needle) ||
        (position.asset?.name ?? "").toLowerCase().includes(needle)
      );
    });
    if (sort === "value") rows.sort((a, b) => b.marketValue - a.marketValue);
    if (sort === "day") rows.sort((a, b) => b.dayPnl - a.dayPnl);
    if (sort === "pnl") rows.sort((a, b) => b.pnl - a.pnl);
    if (sort === "symbol") rows.sort((a, b) => (a.asset?.symbol ?? a.holding.symbol).localeCompare(b.asset?.symbol ?? b.holding.symbol));
    return rows;
  }, [positions, query, sort]);

  const openAsset = (id: string) => {
    setSymbol(id);
    router.push("/");
  };

  const openAdd = () => {
    setEditing(undefined);
    setAddOpen(true);
  };

  const openEdit = (position: PositionMetrics) => {
    setEditing(position.holding);
    setAddOpen(true);
  };

  const remove = (position: PositionMetrics) => {
    const snapshot = position.holding;
    const label = position.asset?.symbol ?? snapshot.symbol;
    removeHolding(snapshot.id);
    toast.success(`${label} position removed`, {
      action: {
        label: "Undo",
        onClick: () =>
          addHolding({
            symbol: snapshot.symbol,
            quantity: snapshot.quantity,
            avgPrice: snapshot.avgPrice,
            purchasedAt: snapshot.purchasedAt,
            notes: snapshot.notes,
          }),
      },
    });
  };

  const confirmClear = () => {
    clearHoldings();
    setClearMode(null);
    toast.success("Portfolio cleared. Add a position or restore the sample.");
  };

  const loading = !hydrated || metrics.isLoading;
  const totalPnl = metrics.totals.totalPnl;
  const dayPnl = metrics.totals.dayPnl;

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Portfolio"
        description="A local, mark-to-market view of your positions. Add holdings manually, track allocation and see how each idea is performing."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setCashOpen(true)}>
              <Coins className="h-3.5 w-3.5" />
              Adjust cash
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-3.5 w-3.5" />
              Add position
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Portfolio actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() => {
                    restoreSamplePortfolio();
                    toast.success("Sample portfolio restored");
                  }}
                >
                  <RotateCcw />
                  Restore sample portfolio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-bearish focus:bg-bearish/10 focus:text-bearish"
                  disabled={!holdings.length}
                  onSelect={() => setClearMode("all")}
                >
                  <Trash2 />
                  Clear all positions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {isSample && hydrated && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning/[0.045] p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-warning/25 bg-warning/10 text-warning">
              <Info className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium text-foreground">You are viewing a sample portfolio</p>
              <p className="mt-0.5 max-w-2xl text-2xs leading-relaxed text-muted">
                These are illustrative holdings, not your real positions. Edit them, add your own or start with a
                clean slate. Everything stays in this browser.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 pl-9 sm:pl-0">
            <Button size="xs" variant="secondary" onClick={openAdd}>
              Add your own
            </Button>
            <Button size="xs" variant="outline" onClick={() => setClearMode("sample")}>
              Start fresh
            </Button>
          </div>
        </div>
      )}

      {metrics.error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-bearish/25 bg-bearish/[0.05] p-3 text-xs text-bearish">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Market quotes could not be refreshed. Values may be based on average cost.
          </span>
          <Button size="xs" variant="ghost" className="text-bearish" onClick={() => void metrics.refetch()}>
            Retry
          </Button>
        </div>
      )}

      <section aria-label="Portfolio summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="panel p-3.5">
          <Stat
            label="Total value"
            value={loading ? <SkeletonValue /> : formatCurrency(totalValue)}
            hint={`${formatCurrency(metrics.totals.investedValue, "USD", true)} invested + cash`}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Day P/L"
            value={loading ? <SkeletonValue /> : signedCurrency(dayPnl)}
            hint={loading ? "Marked to latest quotes" : `${signedPercent(metrics.totals.dayPnlPercent)} today`}
            tone={dayPnl >= 0 ? "up" : "down"}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Total return"
            value={loading ? <SkeletonValue /> : signedCurrency(totalPnl)}
            hint={loading ? "Versus average cost" : `${signedPercent(metrics.totals.totalPnlPercent)} on cost basis`}
            tone={totalPnl >= 0 ? "up" : "down"}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Cost basis"
            value={loading ? <SkeletonValue /> : formatCurrency(metrics.totals.costBasis)}
            hint={`${holdings.length} position${holdings.length === 1 ? "" : "s"}`}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Cash"
            value={loading ? <SkeletonValue /> : formatCurrency(cash)}
            hint={`${formatPercent((cash / (totalValue || 1)) * 100, 1, false)} of portfolio`}
            tone="muted"
          />
        </div>
      </section>

      <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="panel p-4" aria-label="Portfolio performance">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Portfolio value</h2>
              <p className="text-2xs text-subtle">Blended intraday path across your holdings and cash</p>
            </div>
            <Badge variant={metrics.source === "demo" ? "warning" : "brand"}>
              {metrics.source === "demo" ? "Demo feed" : "Provider feed"}
            </Badge>
          </div>
          <PortfolioPerformance values={metrics.portfolioSparkline} isLoading={loading} />
        </section>

        <section className="panel p-4" aria-label="Portfolio allocation">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Allocation</h2>
              <p className="text-2xs text-subtle">Weights include uninvested cash</p>
            </div>
            <Wallet className="h-4 w-4 text-subtle" />
          </div>
          <AllocationChart positions={positions} cash={cash} totalValue={totalValue} isLoading={loading} />
        </section>
      </div>

      <section className="panel overflow-hidden" aria-label="Positions">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                Positions
                <Badge variant="outline">{holdings.length}</Badge>
                {isSample && <Badge variant="warning">Sample</Badge>}
              </h2>
              <p className="mt-0.5 text-2xs text-subtle">Marked to the latest available quote · click a row to chart it</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  void metrics.refetch();
                  toast.success("Portfolio quotes refreshed");
                }}
                aria-label="Refresh portfolio quotes"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", metrics.isFetching && "animate-spin")} />
              </Button>
              <Button size="sm" variant="secondary" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" />
                Add position
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter positions…"
                className="h-8 pl-8 text-xs"
                aria-label="Filter positions"
              />
            </div>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
              aria-label="Sort positions"
            >
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </option>
              ))}
            </select>
            <span className="ml-auto hidden items-center gap-1 text-3xs text-subtle sm:flex">
              <ArrowDownUp className="h-3 w-3" />
              P/L includes current quotes
            </span>
          </div>
        </div>

        {!hydrated ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="skeleton h-8 w-8 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-2.5 w-24" />
                  <div className="skeleton h-2 w-36" />
                </div>
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-3 w-20" />
              </div>
            ))}
          </div>
        ) : positions.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Wallet}
              title="Your portfolio is empty"
              description="Add your first position to track cost basis, market value and performance. You can also restore the sample portfolio to explore the interface."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" onClick={openAdd}>
                    <Plus className="h-3.5 w-3.5" />
                    Add position
                  </Button>
                  <Button size="sm" variant="secondary" onClick={restoreSamplePortfolio}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore sample
                  </Button>
                </div>
              }
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Search}
              title="No positions match"
              description={`Nothing matches “${query}”. Try a different symbol or clear the filter.`}
              action={
                <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                  Clear filter
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-border text-3xs uppercase tracking-[0.06em] text-subtle">
                  <th className="px-4 py-2 font-medium">Instrument</th>
                  <th className="px-3 py-2 text-right font-medium">Quantity</th>
                  <th className="px-3 py-2 text-right font-medium">Avg cost</th>
                  <th className="px-3 py-2 text-right font-medium">Last</th>
                  <th className="px-3 py-2 text-right font-medium">Market value</th>
                  <th className="px-3 py-2 text-right font-medium">Day P/L</th>
                  <th className="px-3 py-2 text-right font-medium">Total P/L</th>
                  <th className="px-3 py-2 font-medium">Weight</th>
                  <th className="px-4 py-2 text-right font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((position) => {
                  const { asset, holding, quote } = position;
                  const label = asset?.symbol ?? holding.symbol;
                  const up = position.pnl >= 0;
                  const dayUp = position.dayPnl >= 0;
                  return (
                    <tr
                      key={holding.id}
                      className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.03]"
                      onClick={() => openAsset(holding.symbol)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md border text-3xs font-semibold",
                              up
                                ? "border-bullish/20 bg-bullish/[0.07] text-bullish"
                                : "border-bearish/20 bg-bearish/[0.07] text-bearish",
                            )}
                          >
                            {label.slice(0, 2)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground">{label}</span>
                              {holding.notes && (
                                <span className="hidden max-w-[140px] truncate text-3xs text-subtle lg:inline">
                                  · {holding.notes}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-2xs text-subtle">{asset?.name ?? "Unknown instrument"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-xs text-foreground">
                        {formatQuantity(holding.quantity)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-xs text-muted">
                        {formatPrice(holding.avgPrice, asset)}
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-xs font-medium text-foreground">
                        {formatPrice(position.price, asset)}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="tnum block text-xs font-medium text-foreground">
                          {formatCurrency(position.marketValue)}
                        </span>
                        {showSparklines && position.sparkline.length > 1 && (
                          <span className="mt-0.5 flex justify-end">
                            <Sparkline
                              values={position.sparkline}
                              width={44}
                              height={12}
                              positive={dayUp}
                              fill={false}
                              strokeWidth={1.2}
                              className="opacity-70"
                            />
                          </span>
                        )}
                      </td>
                      <td className={cn("tnum px-3 py-2.5 text-right text-xs", dayUp ? "text-bullish" : "text-bearish")}>
                        <span className="block">{signedCurrency(position.dayPnl)}</span>
                        <span className="text-3xs opacity-75">{signedPercent(position.dayPnlPercent)}</span>
                      </td>
                      <td className={cn("tnum px-3 py-2.5 text-right text-xs font-medium", up ? "text-bullish" : "text-bearish")}>
                        <span className="block">{signedCurrency(position.pnl)}</span>
                        <span className="text-3xs opacity-75">{signedPercent(position.pnlPercent)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex w-24 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.min(Math.max(position.weight, 0), 100)}%` }}
                            />
                          </div>
                          <span className="tnum w-9 text-right text-3xs text-subtle">
                            {formatPercent(position.weight, 1, false)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEdit(position);
                            }}
                            aria-label={`Edit ${label} position`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="danger-ghost"
                            size="icon-xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              remove(position);
                            }}
                            aria-label={`Remove ${label} position`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronRight className="h-3.5 w-3.5 text-subtle" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-3xs text-subtle">
          <span>
            {filtered.length} of {positions.length} position{positions.length === 1 ? "" : "s"} shown
          </span>
          <span className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", metrics.source === "demo" ? "bg-warning" : "bg-bullish")} />
            {metrics.source === "demo" ? "Simulated valuation" : "Provider valuation"} · {quoteProvider(metrics.positions)}
          </span>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="panel flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-brand">
            <Coins className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">Keep cash in the picture</p>
            <p className="mt-1 text-2xs leading-relaxed text-muted">
              Uninvested cash is included in total value and allocation, so position weights reflect the full
              portfolio rather than just the invested sleeve.
            </p>
            <button
              type="button"
              onClick={() => setCashOpen(true)}
              className="mt-2 inline-flex items-center gap-1 text-2xs font-medium text-brand hover:text-brand/80"
            >
              Adjust cash balance
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="panel flex items-start gap-3 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 text-subtle">
            <Shield className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">A tracker, not a brokerage</p>
            <p className="mt-1 text-2xs leading-relaxed text-muted">
              Positions are entered manually and stored locally. Nothing is executed, connected to a broker or
              sent to a server. Treat the valuation as an estimate, not an account statement.
            </p>
          </div>
        </div>
      </div>

      <HoldingDialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) setEditing(undefined);
        }}
        holding={editing}
      />
      <CashDialog
        open={cashOpen}
        onOpenChange={setCashOpen}
        current={cash}
        onSave={(value) => {
          setCash(value);
          toast.success(`Cash balance set to ${formatCurrency(value)}`);
        }}
      />
      <Dialog open={clearMode !== null} onOpenChange={(open) => !open && setClearMode(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{clearMode === "sample" ? "Start with a clean slate?" : "Clear all positions?"}</DialogTitle>
            <DialogDescription>
              {clearMode === "sample"
                ? "This removes the illustrative sample holdings and keeps your cash balance. You can add your own positions immediately or restore the sample later."
                : "Every position will be removed from this browser. Your cash balance is kept. This cannot be undone, though individual removals can be undone from the toast."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setClearMode(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={confirmClear}>
              <Trash2 className="h-3.5 w-3.5" />
              {clearMode === "sample" ? "Clear sample" : "Clear portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkeletonValue() {
  return <span className="skeleton inline-block h-4 w-20 align-middle" />;
}

function quoteProvider(positions: PositionMetrics[]): string {
  const providers = [...new Set(positions.map((position) => position.quote?.provider).filter(Boolean))];
  if (!providers.length) return "Meridian Simulation";
  return providers.slice(0, 2).join(" / ");
}

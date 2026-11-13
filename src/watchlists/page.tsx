"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { AddSymbolDialog } from "@/components/watchlist/add-symbol-dialog";
import { ListManagerDialog } from "@/components/watchlist/list-manager-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/ui/change-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, Stat } from "@/components/ui/page-header";
import { Sparkline } from "@/components/ui/sparkline";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatCompact, formatPercent, formatPrice, formatTimeAgo } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import { getMarketStatus } from "@/lib/market/market-status";
import { ASSET_CLASS_LABELS } from "@/lib/market/types";
import { usePreferences } from "@/stores/preferences-store";
import { useActiveWatchlist, useWatchlists } from "@/stores/watchlist-store";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

type SortMode = "default" | "change-desc" | "change-asc" | "price-desc" | "symbol";

const SORT_LABELS: Record<SortMode, string> = {
  default: "List order",
  "change-desc": "Change: high to low",
  "change-asc": "Change: low to high",
  "price-desc": "Price: high to low",
  symbol: "Symbol A–Z",
};

export default function WatchlistsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const lists = useWatchlists((state) => state.lists);
  const activeListId = useWatchlists((state) => state.activeListId);
  const setActiveList = useWatchlists((state) => state.setActiveList);
  const removeSymbol = useWatchlists((state) => state.removeSymbol);
  const restoreDefaults = useWatchlists((state) => state.restoreDefaults);
  const watchlist = useActiveWatchlist();
  const setSymbol = useTerminal((state) => state.setSymbol);
  const showSparklines = usePreferences((state) => state.showSparklines);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const snapshotsQuery = useSnapshots(watchlist.symbols, 40);
  const snapshotData = snapshotsQuery.data;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const entries = watchlist.symbols
      .map((id) => {
        const asset = getAsset(id);
        if (!asset) return null;
        if (
          needle &&
          !asset.symbol.toLowerCase().includes(needle) &&
          !asset.name.toLowerCase().includes(needle) &&
          !asset.id.toLowerCase().includes(needle)
        ) {
          return null;
        }
        const snapshot = snapshotData?.snapshots[asset.symbol];
        return { asset, quote: snapshot?.quote, sparkline: snapshot?.sparkline ?? [] };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (sort === "change-desc") {
      entries.sort((a, b) => (b.quote?.changePercent ?? -Infinity) - (a.quote?.changePercent ?? -Infinity));
    }
    if (sort === "change-asc") {
      entries.sort((a, b) => (a.quote?.changePercent ?? Infinity) - (b.quote?.changePercent ?? Infinity));
    }
    if (sort === "price-desc") {
      entries.sort((a, b) => (b.quote?.price ?? -Infinity) - (a.quote?.price ?? -Infinity));
    }
    if (sort === "symbol") entries.sort((a, b) => a.asset.symbol.localeCompare(b.asset.symbol));
    return entries;
  }, [watchlist.symbols, snapshotData, query, sort]);

  const uniqueSymbols = useMemo(
    () => new Set(lists.flatMap((list) => list.symbols)).size,
    [lists],
  );

  const advancing = rows.filter((row) => (row.quote?.changePercent ?? 0) > 0).length;
  const declining = rows.filter((row) => (row.quote?.changePercent ?? 0) < 0).length;
  const averageChange = rows.length
    ? rows.reduce((sum, row) => sum + (row.quote?.changePercent ?? 0), 0) / rows.length
    : 0;
  const leader = [...rows]
    .filter((row) => row.quote)
    .sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0))[0];

  const openAsset = (id: string) => {
    setSymbol(id);
    router.push("/");
  };

  const remove = (id: string, symbol: string) => {
    removeSymbol(id);
    toast.message(`${symbol} removed from ${watchlist.name}`, {
      action: {
        label: "Undo",
        onClick: () => {
          useWatchlists.getState().addSymbol(id, activeListId);
        },
      },
    });
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["market"] });
    toast.success("Watchlist quotes refreshed");
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Watchlists"
        description="Keep a pulse on the instruments that matter. Build focused lists, compare session moves and jump straight into the terminal."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setManageOpen(true)}>
              <Settings2 className="h-3.5 w-3.5" />
              Manage lists
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add instrument
            </Button>
          </>
        }
      />

      <section aria-label="Watchlist summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="panel p-3.5">
          <Stat
            label="Tracked instruments"
            value={uniqueSymbols}
            hint={`${lists.length} watchlist${lists.length === 1 ? "" : "s"} · ${watchlist.symbols.length} in this list`}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Session breadth"
            value={
              <span className="flex items-baseline gap-2">
                <span className="text-bullish">{advancing}</span>
                <span className="text-sm font-normal text-subtle">/</span>
                <span className="text-bearish">{declining}</span>
              </span>
            }
            hint="Advancing vs. declining in the active list"
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Average change"
            value={formatPercent(averageChange, 2)}
            hint={leader ? `Leader: ${leader.asset.symbol} ${formatPercent(leader.quote?.changePercent ?? 0, 2)}` : "Waiting for quotes"}
            tone={averageChange >= 0 ? "up" : "down"}
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Last update"
            value={formatTimeAgo(snapshotData?.timestamp)}
            hint={snapshotData?.source === "demo" ? "Simulated feed" : "Provider feed"}
            tone="muted"
          />
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="panel overflow-hidden" aria-label="Your watchlists">
          <div className="flex h-11 items-center justify-between border-b border-border px-3">
            <span className="text-2xs font-semibold uppercase tracking-[0.07em] text-foreground">Your lists</span>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setManageOpen(true)}
              aria-label="Create or manage watchlists"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <ul className="space-y-0.5 p-1.5">
            {lists.map((list) => {
              const active = list.id === activeListId;
              return (
                <li key={list.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveList(list.id);
                      setQuery("");
                    }}
                    className={cn(
                      "group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-brand/[0.09]" : "hover:bg-foreground/[0.04]",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        active ? "fill-amber-400 text-amber-400" : "text-subtle",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-xs font-medium",
                          active ? "text-foreground" : "text-muted",
                        )}
                      >
                        {list.name}
                      </span>
                      <span className="block text-3xs text-subtle">{list.symbols.length} instruments</span>
                    </span>
                    {active ? (
                      <ChevronRight className="h-3 w-3 shrink-0 text-brand" />
                    ) : (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong opacity-0 transition-opacity group-hover:opacity-100" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start gap-1.5 text-muted"
              onClick={() => {
                restoreDefaults();
                toast.success("Default watchlists restored");
              }}
            >
              <Sparkles className="h-3 w-3" />
              Restore defaults
            </Button>
          </div>
        </aside>

        <section className="panel overflow-hidden" aria-label={`${watchlist.name} instruments`}>
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">{watchlist.name}</h2>
                  <Badge variant="outline">{watchlist.symbols.length}</Badge>
                </div>
                <p className="mt-0.5 text-2xs text-subtle">
                  {rows.length} shown
                  {query ? " after filtering" : ""} · quotes refresh automatically
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" onClick={refresh} aria-label="Refresh quotes">
                  <RefreshCw className={cn("h-3.5 w-3.5", snapshotsQuery.isFetching && "animate-spin")} />
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter this watchlist…"
                  className="h-8 pl-8 text-xs"
                  aria-label="Filter watchlist"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
                aria-label="Sort watchlist"
              >
                {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {SORT_LABELS[mode]}
                  </option>
                ))}
              </select>
              <span className="ml-auto hidden items-center gap-1 text-3xs text-subtle sm:flex">
                <ArrowDownUp className="h-3 w-3" />
                Prices indicative
              </span>
            </div>
          </div>

          {snapshotsQuery.isLoading && rows.length === 0 ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="skeleton h-8 w-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-2.5 w-24" />
                    <div className="skeleton h-2 w-36" />
                  </div>
                  <div className="skeleton h-3 w-16" />
                  <div className="skeleton h-6 w-24" />
                </div>
              ))}
            </div>
          ) : watchlist.symbols.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={ListFilter}
                title="This watchlist is empty"
                description="Add a few instruments to start tracking prices, session changes and trends in one place."
                action={
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add instruments
                  </Button>
                }
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Search}
                title="No instruments match"
                description={`Nothing in ${watchlist.name} matches “${query}”. Try a different ticker or clear the filter.`}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setQuery("")}>
                    Clear filter
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead>
                  <tr className="border-b border-border text-3xs uppercase tracking-[0.06em] text-subtle">
                    <th className="px-4 py-2 font-medium">Instrument</th>
                    <th className="px-3 py-2 text-right font-medium">Last</th>
                    <th className="px-3 py-2 text-right font-medium">Change</th>
                    <th className="px-3 py-2 text-right font-medium">Chg %</th>
                    <th className="px-3 py-2 text-center font-medium">Trend</th>
                    <th className="px-3 py-2 font-medium">Session</th>
                    <th className="px-4 py-2 text-right font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ asset, quote, sparkline }) => {
                    const up = (quote?.changePercent ?? 0) >= 0;
                    const status = getMarketStatus(asset);
                    return (
                      <tr
                        key={asset.id}
                        className="group cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-foreground/[0.03]"
                        onClick={() => openAsset(asset.id)}
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
                              {asset.symbol.slice(0, 2)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-foreground">{asset.symbol}</span>
                                <Badge variant="outline" className="hidden px-1 py-0.5 text-[9px] sm:inline-flex">
                                  {ASSET_CLASS_LABELS[asset.class]}
                                </Badge>
                              </div>
                              <p className="truncate text-2xs text-subtle">{asset.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="tnum px-3 py-2.5 text-right text-xs font-medium text-foreground">
                          {quote ? formatPrice(quote.price, asset) : "—"}
                        </td>
                        <td className={cn("tnum px-3 py-2.5 text-right text-xs", up ? "text-bullish" : "text-bearish")}>
                          {quote
                            ? `${quote.change >= 0 ? "+" : "−"}${formatPrice(Math.abs(quote.change), asset)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {quote ? (
                            <ChangeBadge change={quote.change} changePercent={quote.changePercent} size="sm" />
                          ) : (
                            <span className="skeleton inline-block h-4 w-14" />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex justify-center">
                            {showSparklines && sparkline.length > 1 ? (
                              <Sparkline values={sparkline} width={88} height={24} positive={up} fill={false} />
                            ) : (
                              <span className="text-3xs text-subtle">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-2xs text-muted">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                status.state === "open" || status.state === "24-7"
                                  ? "bg-bullish"
                                  : status.state === "pre" || status.state === "post"
                                    ? "bg-warning"
                                    : "bg-border-strong",
                              )}
                            />
                            {status.label}
                          </span>
                          <span className="mt-0.5 block text-3xs text-subtle">
                            Vol {quote ? formatCompact(quote.volume) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAsset(asset.id);
                              }}
                              aria-label={`Open ${asset.symbol} chart`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="danger-ghost"
                              size="icon-xs"
                              onClick={(event) => {
                                event.stopPropagation();
                                remove(asset.id, asset.symbol);
                              }}
                              aria-label={`Remove ${asset.symbol} from ${watchlist.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
              {advancing} advancing · {declining} declining · {rows.length - advancing - declining} flat
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-brand transition-colors hover:text-brand/80"
            >
              Open terminal
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <InsightCard
          icon={Layers}
          title="Organize by thesis"
          body="Separate macro hedges, high-beta growth and digital assets. Each list keeps its own order and is restored on your next visit."
          action="Manage lists"
          onClick={() => setManageOpen(true)}
        />
        <InsightCard
          icon={TrendingUp}
          title="Follow the leaders"
          body="Sort by session change to surface momentum, or alphabetically when you know exactly what you are looking for."
          action="Add instruments"
          onClick={() => setAddOpen(true)}
        />
        <InsightCard
          icon={TrendingDown}
          title="Review the laggards"
          body="Weakness can be a warning or an opportunity. Open any row to inspect the full chart with indicators and drawings."
          action="Open terminal"
          onClick={() => openAsset(watchlist.symbols[0] ?? "BTCUSD")}
        />
      </div>

      <p className="pb-2 text-3xs leading-relaxed text-subtle">
        Watchlists and ordering are stored locally in this browser. Prices are indicative and may be delayed;
        demonstration data is generated by Meridian Simulation.
      </p>

      <AddSymbolDialog open={addOpen} onOpenChange={setAddOpen} listId={activeListId} />
      <ListManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  body,
  action,
  onClick,
}: {
  icon: typeof Layers;
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="panel flex flex-col p-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-2 text-brand">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <h3 className="mt-3 text-xs font-semibold text-foreground">{title}</h3>
      <p className="mt-1 flex-1 text-2xs leading-relaxed text-muted">{body}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-3 inline-flex items-center gap-1 self-start text-2xs font-medium text-brand transition-colors hover:text-brand/80"
      >
        {action}
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

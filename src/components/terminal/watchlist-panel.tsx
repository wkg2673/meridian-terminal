"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronDown,
  ListFilter,
  Plus,
  Search,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AddSymbolDialog } from "@/components/watchlist/add-symbol-dialog";
import { ListManagerDialog } from "@/components/watchlist/list-manager-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkline } from "@/components/ui/sparkline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatCompact, formatPercent, formatPrice } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import { getMarketStatus } from "@/lib/market/market-status";
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

export function WatchlistPanel() {
  const lists = useWatchlists((state) => state.lists);
  const activeListId = useWatchlists((state) => state.activeListId);
  const setActiveList = useWatchlists((state) => state.setActiveList);
  const removeSymbol = useWatchlists((state) => state.removeSymbol);
  const watchlist = useActiveWatchlist();
  const symbol = useTerminal((state) => state.symbol);
  const setSymbol = useTerminal((state) => state.setSymbol);
  const showSparklines = usePreferences((state) => state.showSparklines);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("default");
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const { data, isLoading } = useSnapshots(watchlist.symbols, 32);

  const rows = useMemo(() => {
    const entries = watchlist.symbols
      .map((id) => {
        const asset = getAsset(id);
        if (!asset) return null;
        const snapshot = data?.snapshots[asset.symbol];
        const needle = query.trim().toLowerCase();
        if (
          needle &&
          !asset.symbol.toLowerCase().includes(needle) &&
          !asset.name.toLowerCase().includes(needle) &&
          !asset.id.toLowerCase().includes(needle)
        ) {
          return null;
        }
        return { asset, quote: snapshot?.quote, sparkline: snapshot?.sparkline ?? [] };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

    if (sort === "change-desc") entries.sort((a, b) => (b.quote?.changePercent ?? -Infinity) - (a.quote?.changePercent ?? -Infinity));
    if (sort === "change-asc") entries.sort((a, b) => (a.quote?.changePercent ?? Infinity) - (b.quote?.changePercent ?? Infinity));
    if (sort === "price-desc") entries.sort((a, b) => (b.quote?.price ?? -Infinity) - (a.quote?.price ?? -Infinity));
    if (sort === "symbol") entries.sort((a, b) => a.asset.symbol.localeCompare(b.asset.symbol));
    return entries;
  }, [watchlist.symbols, data, query, sort]);

  const remove = (id: string, assetSymbol: string) => {
    removeSymbol(id);
    toast.message(`${assetSymbol} removed from ${watchlist.name}`);
  };

  return (
    <section className="flex min-h-0 flex-[1.25] flex-col border-b border-border" aria-label="Watchlist">
      <div className="flex h-9 shrink-0 items-center justify-between gap-1 border-b border-border px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-2xs font-semibold uppercase tracking-[0.06em] text-foreground transition-colors hover:bg-foreground/[0.05]"
            >
              <Star className="h-3 w-3 shrink-0 text-amber-400" />
              <span className="truncate">{watchlist.name}</span>
              <ChevronDown className="h-2.5 w-2.5 shrink-0 text-subtle" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Watchlists</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={activeListId} onValueChange={setActiveList}>
              {lists.map((list) => (
                <DropdownMenuRadioItem key={list.id} value={list.id}>
                  <span className="flex flex-1 items-center justify-between gap-2">
                    <span className="truncate">{list.name}</span>
                    <span className="font-mono text-3xs text-subtle">{list.symbols.length}</span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setManageOpen(true)}>
              <Settings2 />
              Manage watchlists
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={() => setAddOpen(true)} aria-label="Add instrument">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add instrument</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={() => setManageOpen(true)} aria-label="Manage lists">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Manage watchlists</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter list"
            className="h-7 rounded-md border-transparent bg-surface-2/60 pl-7 pr-6 text-2xs focus-visible:border-border"
            aria-label="Filter watchlist"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
              aria-label="Clear filter"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn("shrink-0", sort !== "default" && "text-brand")}
              aria-label="Sort watchlist"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortMode)}>
              {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                <DropdownMenuRadioItem key={mode} value={mode}>
                  {SORT_LABELS[mode]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_64px_46px] items-center gap-1 border-b border-border/70 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.06em] text-subtle">
        <span>Instrument</span>
        <span className="text-right">Last</span>
        <span className="text-right">Chg%</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {isLoading && watchlist.symbols.length === 0 ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md px-1 py-1.5">
                <div className="skeleton h-7 w-7 rounded-md" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-2.5 w-16" />
                  <div className="skeleton h-2 w-24" />
                </div>
                <div className="skeleton h-3 w-12" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <ListFilter className="h-5 w-5 text-subtle" />
            <p className="text-xs font-medium text-foreground">
              {query ? "No instruments match your filter" : "This watchlist is empty"}
            </p>
            <p className="text-2xs leading-relaxed text-muted">
              {query ? "Clear the filter or try another ticker." : "Add instruments to start tracking them here."}
            </p>
            <Button size="xs" variant="secondary" className="mt-1" onClick={() => setAddOpen(true)}>
              <Plus className="h-3 w-3" />
              Add instrument
            </Button>
          </div>
        ) : (
          <ul className="p-1">
            {rows.map(({ asset, quote, sparkline }) => {
              const active = symbol === asset.id;
              const inList = watchlist.symbols.includes(asset.id);
              const up = (quote?.changePercent ?? 0) >= 0;
              const status = getMarketStatus(asset);
              return (
                <li key={asset.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => setSymbol(asset.id)}
                    className={cn(
                      "grid w-full grid-cols-[minmax(0,1fr)_64px_46px] items-center gap-1 rounded-md px-2 py-1.5 text-left transition-colors",
                      active ? "bg-brand/[0.09]" : "hover:bg-foreground/[0.04]",
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          status.state === "open" || status.state === "24-7"
                            ? "bg-bullish"
                            : status.state === "pre" || status.state === "post"
                              ? "bg-warning"
                              : "bg-border-strong",
                        )}
                        title={status.label}
                      />
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-2xs font-semibold",
                            active ? "text-brand" : "text-foreground",
                          )}
                        >
                          {asset.symbol}
                        </span>
                        <span className="block truncate text-3xs text-subtle">{asset.name}</span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="tnum block text-2xs font-medium text-foreground">
                        {quote ? formatPrice(quote.price, asset) : "—"}
                      </span>
                      <span className="mt-0.5 flex justify-end">
                        {showSparklines && sparkline.length > 1 ? (
                          <Sparkline
                            values={sparkline}
                            width={40}
                            height={12}
                            positive={up}
                            fill={false}
                            strokeWidth={1.2}
                            className="opacity-80"
                          />
                        ) : null}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "tnum text-right text-2xs font-medium",
                        up ? "text-bullish" : "text-bearish",
                      )}
                    >
                      {quote ? formatPercent(quote.changePercent, 2, false) : "—"}
                    </span>
                  </button>
                  {inList && (
                    <button
                      type="button"
                      onClick={() => remove(asset.id, asset.symbol)}
                      className="absolute right-1 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded bg-surface text-subtle opacity-0 shadow-sm transition-opacity hover:bg-bearish/10 hover:text-bearish group-hover:opacity-100"
                      aria-label={`Remove ${asset.symbol} from watchlist`}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </ScrollArea>

      <div className="flex shrink-0 items-center justify-between border-t border-border px-3 py-1.5 text-3xs text-subtle">
        <span>
          {rows.length} of {watchlist.symbols.length} instruments
        </span>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 text-brand transition-colors hover:text-brand/80"
        >
          <Plus className="h-2.5 w-2.5" />
          Add
        </button>
      </div>

      <AddSymbolDialog open={addOpen} onOpenChange={setAddOpen} listId={activeListId} />
      <ListManagerDialog open={manageOpen} onOpenChange={setManageOpen} />
    </section>
  );
}

export function AssetDetailsPanel() {
  const symbol = useTerminal((state) => state.symbol);
  const asset = getAsset(symbol);
  const { data } = useSnapshots([symbol], 24);
  const snapshot = asset ? data?.snapshots[asset.symbol] : undefined;
  const quote = snapshot?.quote;
  const status = asset ? getMarketStatus(asset) : null;

  if (!asset) return null;

  const range = quote ? Math.max(quote.high - quote.low, 0) : 0;
  const rangePosition = quote && range > 0 ? Math.min(Math.max(((quote.price - quote.low) / range) * 100, 0), 100) : 50;
  const marketCap = quote?.marketCap ?? asset.marketCap;

  const stats = [
    { label: "Market cap", value: marketCap ? formatCompact(marketCap) : "—" },
    { label: "Volume", value: quote ? formatCompact(quote.volume) : "—" },
    { label: "Avg volume", value: formatCompact(asset.avgVolume) },
    { label: "Currency", value: asset.currency },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-label="Instrument details">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-2xs font-semibold uppercase tracking-[0.06em] text-foreground">Instrument</span>
        <span className="font-mono text-3xs text-subtle">{asset.exchange}</span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-foreground">{asset.name}</h2>
              <span className="rounded border border-border bg-surface-2 px-1 py-0.5 text-[9px] uppercase tracking-wide text-subtle">
                {asset.class}
              </span>
            </div>
            <p className="mt-1.5 text-2xs leading-relaxed text-muted">{asset.description}</p>
          </div>

          {quote && (
            <div className="rounded-lg border border-border bg-surface-2/50 p-2.5">
              <div className="flex items-baseline justify-between text-2xs">
                <span className="text-subtle">Day range</span>
                <span className="tnum font-mono text-muted">
                  {formatPrice(quote.low, asset)} – {formatPrice(quote.high, asset)}
                </span>
              </div>
              <div className="relative mt-2 h-1 rounded-full bg-border">
                <div className="absolute inset-y-0 left-0 rounded-full bg-brand/30" style={{ width: `${rangePosition}%` }} />
                <span
                  className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand"
                  style={{ left: `${rangePosition}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-3xs text-subtle">
                <span>Low</span>
                <span>Last {formatPrice(quote.price, asset)}</span>
                <span>High</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {stats.map((entry) => (
              <div key={entry.label} className="rounded-md border border-border bg-surface-2/40 px-2 py-1.5">
                <p className="text-3xs text-subtle">{entry.label}</p>
                <p className="tnum mt-0.5 text-2xs font-medium text-foreground">{entry.value}</p>
              </div>
            ))}
          </div>

          {status && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-surface-2/40 px-2.5 py-2">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  status.state === "open" || status.state === "24-7"
                    ? "bg-bullish"
                    : status.state === "pre" || status.state === "post"
                      ? "bg-warning"
                      : "bg-border-strong",
                )}
              />
              <div className="min-w-0">
                <p className="text-2xs font-medium text-foreground">Market {status.label.toLowerCase()}</p>
                <p className="text-3xs leading-relaxed text-subtle">{status.detail}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-2.5 py-2 text-3xs text-subtle">
            <span>Data source</span>
            <span className={quote?.source === "demo" ? "text-warning" : "text-bullish"}>
              {quote?.provider ?? "Meridian Simulation"}
            </span>
          </div>
        </div>
      </ScrollArea>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  Globe2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/ui/change-badge";
import { Sparkline } from "@/components/ui/sparkline";
import { PageHeader, Stat } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatCompact, formatPercent, formatPrice, formatTimeAgo } from "@/lib/format";
import { ASSETS, FEATURED_SYMBOLS, getAsset } from "@/lib/market/assets";
import { getMarketStatus } from "@/lib/market/market-status";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import { usePreferences } from "@/stores/preferences-store";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const CLASSES: Array<AssetClass | "all"> = ["all", "crypto", "stock", "etf", "forex", "index", "commodity"];
const ALL_IDS = ASSETS.map((asset) => asset.id);
const CLASS_TABS: Array<{ id: AssetClass | "all"; label: string }> = CLASSES.map((id) => ({
  id,
  label: id === "all" ? "All markets" : ASSET_CLASS_LABELS[id],
}));

type SortMode = "change-desc" | "change-asc" | "price-desc" | "volume-desc" | "symbol";

const SORT_LABELS: Record<SortMode, string> = {
  "change-desc": "Biggest gainers",
  "change-asc": "Biggest losers",
  "price-desc": "Highest price",
  "volume-desc": "Highest volume",
  symbol: "Symbol A–Z",
};

export default function MarketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setSymbol = useTerminal((state) => state.setSymbol);
  const showSparklines = usePreferences((state) => state.showSparklines);
  const [assetClass, setAssetClass] = useState<AssetClass | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("change-desc");

  const overview = useSnapshots(FEATURED_SYMBOLS, 40);
  const all = useSnapshots(ALL_IDS, 32);

  const openAsset = (id: string) => {
    setSymbol(id);
    router.push("/");
  };

  const allRows = useMemo(() => {
    return ALL_IDS.map((id) => {
      const asset = getAsset(id);
      if (!asset) return null;
      const snapshot = all.data?.snapshots[asset.symbol];
      return { asset, quote: snapshot?.quote, sparkline: snapshot?.sparkline ?? [] };
    }).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [all.data]);

  const movers = useMemo(
    () =>
      [...allRows]
        .filter((entry) => entry.quote)
        .sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0)),
    [allRows],
  );

  const gainers = movers.slice(0, 5);
  const losers = [...movers].reverse().slice(0, 5);

  const gainersCount = allRows.filter((entry) => (entry.quote?.changePercent ?? 0) > 0).length;
  const losersCount = allRows.filter((entry) => (entry.quote?.changePercent ?? 0) < 0).length;
  const avgChange = allRows.length
    ? allRows.reduce((sum, entry) => sum + (entry.quote?.changePercent ?? 0), 0) / allRows.length
    : 0;
  const totalVolume = allRows.reduce((sum, entry) => sum + (entry.quote?.volume ?? 0), 0);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const rows = allRows.filter(({ asset }) => {
      if (assetClass !== "all" && asset.class !== assetClass) return false;
      if (!needle) return true;
      return (
        asset.symbol.toLowerCase().includes(needle) ||
        asset.name.toLowerCase().includes(needle) ||
        asset.exchange.toLowerCase().includes(needle)
      );
    });
    if (sort === "symbol") rows.sort((a, b) => a.asset.symbol.localeCompare(b.asset.symbol));
    if (sort === "price-desc") rows.sort((a, b) => (b.quote?.price ?? 0) - (a.quote?.price ?? 0));
    if (sort === "volume-desc") rows.sort((a, b) => (b.quote?.volume ?? 0) - (a.quote?.volume ?? 0));
    if (sort === "change-desc") rows.sort((a, b) => (b.quote?.changePercent ?? 0) - (a.quote?.changePercent ?? 0));
    if (sort === "change-asc") rows.sort((a, b) => (a.quote?.changePercent ?? 0) - (b.quote?.changePercent ?? 0));
    return rows;
  }, [allRows, assetClass, query, sort]);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["market"] });
    toast.success("Market data refreshed");
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Global markets"
        title="Market overview"
        description="Scan the world's major asset classes at a glance. Open any instrument in the terminal for full charting and analysis."
        actions={
          <>
            <DataSourceBadge />
            <Button variant="secondary" size="sm" onClick={refresh}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href="/">
                Open terminal
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Market summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="panel p-3.5">
          <Stat
            label="Advancing"
            value={gainersCount}
            hint={`${losersCount} declining · ${allRows.length} tracked`}
            tone="up"
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Average change"
            value={formatPercent(avgChange, 2)}
            hint="Session move across tracked markets"
            tone={avgChange >= 0 ? "up" : "down"}
          />
        </div>
        <div className="panel p-3.5">
          <Stat label="Tracked volume" value={formatCompact(totalVolume)} hint="Aggregate 24h / session volume" />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Last update"
            value={formatTimeAgo(all.data?.timestamp)}
            hint={all.data?.source === "demo" ? "Simulated feed" : "Provider feed"}
            tone="muted"
          />
        </div>
      </section>

      <section aria-label="Featured markets" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Major markets</h2>
            <p className="text-2xs text-subtle">Benchmarks across equities, crypto, FX and metals</p>
          </div>
          <span className="hidden text-3xs text-subtle sm:block">Click a card to open the chart</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURED_SYMBOLS.map((id) => {
            const asset = getAsset(id);
            if (!asset) return null;
            const snapshot = overview.data?.snapshots[asset.symbol];
            const quote = snapshot?.quote;
            const up = (quote?.changePercent ?? 0) >= 0;
            const status = getMarketStatus(asset);
            return (
              <button
                key={id}
                type="button"
                onClick={() => openAsset(id)}
                className="group panel relative overflow-hidden p-3.5 text-left transition-all duration-200 hover:border-border-strong hover:shadow-panel"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold tracking-tight text-foreground">
                        {asset.symbol}
                      </span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          status.state === "open" || status.state === "24-7"
                            ? "bg-bullish"
                            : status.state === "pre" || status.state === "post"
                              ? "bg-warning"
                              : "bg-border-strong",
                        )}
                        title={status.label}
                      />
                    </div>
                    <p className="truncate text-2xs text-subtle">{asset.name}</p>
                  </div>
                  <ExternalLink className="h-3 w-3 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div>
                    <p className="tnum text-[19px] font-semibold leading-none tracking-tight text-foreground">
                      {quote ? formatPrice(quote.price, asset) : "—"}
                    </p>
                    <div className="mt-1.5">
                      {quote ? (
                        <ChangeBadge change={quote.change} changePercent={quote.changePercent} size="sm" />
                      ) : (
                        <span className="skeleton inline-block h-4 w-16" />
                      )}
                    </div>
                  </div>
                  {showSparklines && snapshot?.sparkline?.length ? (
                    <Sparkline values={snapshot.sparkline} width={84} height={34} positive={up} showEndDot />
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2 text-3xs text-subtle">
                  <span>{status.label}</span>
                  <span>{quote ? `${quote.provider}` : "Loading"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MoversCard
          title="Top gainers"
          description="Strongest session performance"
          icon={TrendingUp}
          tone="up"
          rows={gainers}
          onSelect={openAsset}
        />
        <MoversCard
          title="Top losers"
          description="Weakest session performance"
          icon={TrendingDown}
          tone="down"
          rows={losers}
          onSelect={openAsset}
        />
      </div>

      <section className="panel overflow-hidden" aria-label="All instruments">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">All instruments</h2>
              <p className="text-2xs text-subtle">{filtered.length} markets · live quotes refresh automatically</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search markets…"
                  className="h-8 w-44 rounded-md pl-8 text-xs sm:w-64"
                  aria-label="Search instruments"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortMode)}
                className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
                aria-label="Sort instruments"
              >
                {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
                  <option key={mode} value={mode}>
                    {SORT_LABELS[mode]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="no-scrollbar -mb-1 flex items-center gap-1 overflow-x-auto">
            {CLASS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAssetClass(tab.id)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-2xs transition-colors",
                  assetClass === tab.id
                    ? "bg-brand/15 font-medium text-brand"
                    : "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-border text-3xs uppercase tracking-[0.06em] text-subtle">
                <th className="px-4 py-2 font-medium">Instrument</th>
                <th className="px-3 py-2 text-right font-medium">Last</th>
                <th className="px-3 py-2 text-right font-medium">Change</th>
                <th className="px-3 py-2 text-right font-medium">Chg %</th>
                <th className="px-3 py-2 text-right font-medium">Volume</th>
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 text-center font-medium">Trend</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-muted">
                    No instruments match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map(({ asset, quote, sparkline }) => {
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
                          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface-2 text-3xs font-semibold text-muted">
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
                        {quote ? `${quote.change >= 0 ? "+" : ""}${formatPrice(Math.abs(quote.change), asset)}` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={cn(
                            "tnum inline-flex items-center gap-0.5 text-xs font-medium",
                            up ? "text-bullish" : "text-bearish",
                          )}
                        >
                          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {quote ? formatPercent(quote.changePercent, 2, false) : "—"}
                        </span>
                      </td>
                      <td className="tnum px-3 py-2.5 text-right text-2xs text-muted">
                        {quote ? formatCompact(quote.volume) : "—"}
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
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          {showSparklines && sparkline.length > 1 ? (
                            <Sparkline values={sparkline} width={72} height={22} positive={up} fill={false} />
                          ) : (
                            <span className="text-3xs text-subtle">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-2xs text-brand opacity-0 transition-opacity group-hover:opacity-100">
                          Chart
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 text-3xs text-subtle">
        <span className="flex items-center gap-1.5">
          <Globe2 className="h-3 w-3" />
          {all.data?.source === "demo" ? "Demonstration data" : "Provider data"} · quotes update every few seconds
        </span>
        <span className="flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3" />
          Prices are indicative and may be delayed.
        </span>
      </div>
    </div>
  );
}

function MoversCard({
  title,
  description,
  icon: Icon,
  tone,
  rows,
  onSelect,
}: {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  tone: "up" | "down";
  rows: Array<{
    asset: NonNullable<ReturnType<typeof getAsset>>;
    quote?: { price: number; changePercent: number };
    sparkline: number[];
  }>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md",
              tone === "up" ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-xs font-semibold text-foreground">{title}</h3>
            <p className="text-3xs text-subtle">{description}</p>
          </div>
        </div>
        <span className="font-mono text-3xs text-subtle">24H</span>
      </div>
      <ul>
        {rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-2xs text-subtle">Waiting for market data…</li>
        ) : (
          rows.map(({ asset, quote }) => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onSelect(asset.id)}
                className="flex w-full items-center gap-3 border-b border-border/50 px-4 py-2 text-left transition-colors last:border-0 hover:bg-foreground/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground">{asset.symbol}</p>
                  <p className="truncate text-3xs text-subtle">{asset.name}</p>
                </div>
                <p className="tnum text-xs text-foreground">{quote ? formatPrice(quote.price, asset) : "—"}</p>
                <span
                  className={cn(
                    "tnum w-16 text-right text-2xs font-medium",
                    (quote?.changePercent ?? 0) >= 0 ? "text-bullish" : "text-bearish",
                  )}
                >
                  {quote ? formatPercent(quote.changePercent, 2, false) : "—"}
                </span>
                <ChevronRight className="h-3 w-3 text-subtle" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

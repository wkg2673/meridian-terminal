"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Bitcoin,
  Globe2,
  Layers,
  Plus,
  Star,
  Wallet,
  ArrowLeftRight,
  Gem,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { HoldingDialog } from "@/components/portfolio/holding-dialog";
import { ChangeBadge } from "@/components/ui/change-badge";
import { Sparkline } from "@/components/ui/sparkline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatClock, formatCompact, formatPrice, formatTimeAgo } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import { getMarketStatus } from "@/lib/market/market-status";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import { useActiveWatchlist, useWatchlists } from "@/stores/watchlist-store";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const CLASS_ICONS: Record<AssetClass, LucideIcon> = {
  crypto: Bitcoin,
  stock: Building2,
  etf: Layers,
  forex: ArrowLeftRight,
  index: Globe2,
  commodity: Gem,
};

const CLASS_TONES: Record<AssetClass, string> = {
  crypto: "from-amber-500/20 to-orange-500/5 text-amber-500",
  stock: "from-blue-500/20 to-blue-500/5 text-blue-400",
  etf: "from-violet-500/20 to-violet-500/5 text-violet-400",
  forex: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  index: "from-cyan-500/20 to-cyan-500/5 text-cyan-400",
  commodity: "from-yellow-500/20 to-yellow-500/5 text-yellow-500",
};

export function SymbolHeader() {
  const symbol = useTerminal((state) => state.symbol);
  const asset = getAsset(symbol);
  const { data } = useSnapshots([symbol], 40);
  const watchlist = useActiveWatchlist();
  const addSymbol = useWatchlists((state) => state.addSymbol);
  const removeSymbol = useWatchlists((state) => state.removeSymbol);
  const [holdingOpen, setHoldingOpen] = useState(false);

  const snapshot = asset ? data?.snapshots[asset.symbol] : undefined;
  const quote = snapshot?.quote;
  const inWatchlist = asset ? watchlist.symbols.includes(asset.id) : false;
  const status = asset ? getMarketStatus(asset) : null;
  const up = (quote?.changePercent ?? 0) >= 0;
  const Icon = asset ? CLASS_ICONS[asset.class] : Globe2;

  const toggleWatchlist = () => {
    if (!asset) return;
    if (inWatchlist) {
      removeSymbol(asset.id);
      toast.message(`${asset.symbol} removed from ${watchlist.name}`);
    } else {
      addSymbol(asset.id);
      toast.success(`${asset.symbol} added to ${watchlist.name}`);
    }
  };

  if (!asset) {
    return (
      <div className="border-b border-border bg-surface px-4 py-4 text-sm text-muted">
        Unknown instrument. Use <kbd className="hotkey">⌘K</kbd> to search the market.
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-border bg-surface px-3 py-2 md:px-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-gradient-to-br",
              CLASS_TONES[asset.class],
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{asset.symbol}</h1>
              <span className="hidden rounded border border-border bg-surface-2 px-1 py-0.5 text-[9px] font-medium uppercase tracking-wide text-subtle sm:inline">
                {ASSET_CLASS_LABELS[asset.class]}
              </span>
            </div>
            <p className="truncate text-2xs text-subtle">
              {asset.name} <span className="text-border-strong">·</span> {asset.exchange}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="tnum text-[22px] font-semibold leading-none tracking-tight text-foreground">
            {quote ? formatPrice(quote.price, asset) : "—"}
          </span>
          {quote ? (
            <ChangeBadge change={quote.change} changePercent={quote.changePercent} size="sm" />
          ) : (
            <span className="h-4 w-16 animate-pulse rounded bg-foreground/[0.07]" />
          )}
          {quote && (
            <span className={cn("flex items-center gap-0.5 text-2xs", up ? "text-bullish" : "text-bearish")}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {quote.currency}
            </span>
          )}
        </div>

        {snapshot?.sparkline?.length ? (
          <Sparkline
            values={snapshot.sparkline}
            width={110}
            height={30}
            positive={up}
            className="hidden sm:block"
            showEndDot
          />
        ) : null}

        <div className="hidden items-center gap-4 border-l border-border pl-4 xl:flex">
          {[
            { label: "Open", value: quote?.open },
            { label: "High", value: quote?.high },
            { label: "Low", value: quote?.low },
            { label: "Prev close", value: quote?.prevClose },
            { label: "Volume", value: quote?.volume },
          ].map((entry) => (
            <div key={entry.label} className="text-left">
              <p className="text-[9px] uppercase tracking-wide text-subtle">{entry.label}</p>
              <p className="tnum mt-0.5 text-2xs font-medium text-foreground">
                {entry.value === undefined
                  ? "—"
                  : entry.label === "Volume"
                    ? formatCompact(entry.value)
                    : formatPrice(entry.value, asset)}
              </p>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleWatchlist}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                  inWatchlist
                    ? "text-amber-400 hover:bg-amber-400/10"
                    : "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
                )}
                aria-label={inWatchlist ? `Remove ${asset.symbol} from watchlist` : `Add ${asset.symbol} to watchlist`}
              >
                <Star className={cn("h-4 w-4", inWatchlist && "fill-current")} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {inWatchlist ? `Remove from ${watchlist.name}` : `Add to ${watchlist.name}`}
            </TooltipContent>
          </Tooltip>

          <button
            type="button"
            onClick={() => setHoldingOpen(true)}
            className="hidden h-8 items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-elevated sm:flex"
          >
            <Plus className="h-3.5 w-3.5" />
            Add position
          </button>

          <Link
            href="/portfolio"
            className="flex h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted transition-colors hover:bg-foreground/[0.055] hover:text-foreground"
          >
            <Wallet className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Portfolio</span>
            <ChevronRight className="h-3 w-3 opacity-50" />
          </Link>
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-3xs text-subtle">
        {status && (
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                status.state === "open" || status.state === "24-7"
                  ? "bg-bullish"
                  : status.state === "pre" || status.state === "post"
                    ? "bg-warning"
                    : "bg-subtle",
              )}
            />
            <span className="text-muted">{status.label}</span>
            <span className="hidden md:inline">· {status.detail}</span>
          </span>
        )}
        <span className="hidden items-center gap-1 sm:flex">
          {quote ? (
            <>
              Quote updated {formatTimeAgo(quote.timestamp)} · {formatClock(quote.timestamp)}
              <span className="text-border-strong">·</span>
              <span className={quote.source === "demo" ? "text-warning" : "text-bullish"}>
                {quote.source === "demo" ? "simulated" : quote.source}
              </span>
            </>
          ) : (
            "Waiting for quote…"
          )}
        </span>
        <span className="ml-auto hidden font-mono text-3xs lg:inline">
          {asset.providerIds?.twelveData ?? asset.id} · {asset.currency}
        </span>
      </div>

      <HoldingDialog
        open={holdingOpen}
        onOpenChange={setHoldingOpen}
        initialSymbol={asset.id}
      />
    </div>
  );
}

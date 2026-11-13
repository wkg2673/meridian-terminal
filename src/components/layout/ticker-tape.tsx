"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import { useQuotes } from "@/hooks/use-market-data";
import { getAsset, TICKER_SYMBOLS } from "@/lib/market/assets";
import { formatPercent, formatPrice } from "@/lib/format";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

export function TickerTape() {
  const { data, isLoading } = useQuotes(TICKER_SYMBOLS);
  const setSymbol = useTerminal((state) => state.setSymbol);
  const router = useRouter();
  const pathname = usePathname();

  const openAsset = (symbol: string, id: string) => {
    setSymbol(id);
    if (pathname !== "/") router.push("/");
  };

  return (
    <div className="group relative flex h-8 shrink-0 items-center overflow-hidden border-b border-border bg-surface/70">
      <div className="z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-border bg-surface px-3 text-3xs font-semibold uppercase tracking-[0.1em] text-subtle">
        <Activity className="h-3 w-3 text-brand" />
        <span className="hidden sm:inline">Markets</span>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {TICKER_SYMBOLS.map((id) => {
                const asset = getAsset(id);
                if (!asset) return null;
                const quote = data?.find((entry) => entry.symbol === asset.symbol);
                const up = (quote?.changePercent ?? 0) >= 0;
                return (
                  <button
                    key={`${copy}-${id}`}
                    type="button"
                    onClick={() => openAsset(asset.symbol, asset.id)}
                    className="group/item flex h-8 items-center gap-2 border-r border-border/60 px-3 text-left transition-colors hover:bg-foreground/[0.04]"
                    title={`${asset.name} — open chart`}
                  >
                    <span className="text-2xs font-medium text-muted group-hover/item:text-foreground">
                      {asset.symbol}
                    </span>
                    {isLoading && !quote ? (
                      <span className="h-2 w-12 animate-pulse rounded bg-foreground/[0.08]" />
                    ) : (
                      <>
                        <span className="tnum text-2xs text-foreground/90">
                          {quote ? formatPrice(quote.price, asset) : "—"}
                        </span>
                        <span
                          className={cn(
                            "tnum flex items-center gap-0.5 text-3xs font-medium",
                            up ? "text-bullish" : "text-bearish",
                          )}
                        >
                          {up ? (
                            <ArrowUpRight className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDownRight className="h-2.5 w-2.5" />
                          )}
                          {quote ? formatPercent(quote.changePercent, 2, false) : "—"}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent" />
      </div>
    </div>
  );
}

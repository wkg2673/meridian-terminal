"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  Bitcoin,
  CornerDownLeft,
  Gem,
  Globe2,
  Layers,
  Search,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { searchAssets } from "@/lib/market/assets";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import { useTerminal } from "@/stores/terminal-store";
import { useUi } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const CLASS_ICONS: Record<AssetClass, typeof TrendingUp> = {
  crypto: Bitcoin,
  stock: Building2,
  etf: Layers,
  forex: ArrowLeftRight,
  index: Globe2,
  commodity: Gem,
};

export function CommandSearch() {
  const open = useUi((state) => state.searchOpen);
  const setOpen = useUi((state) => state.setSearchOpen);
  const setSymbol = useTerminal((state) => state.setSymbol);
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => searchAssets(query, 10), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const select = (id: string) => {
    setSymbol(id);
    setOpen(false);
    if (pathname !== "/") router.push("/");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index + 1) % results.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (results.length ? (index - 1 + results.length) % results.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) select(target.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent hideClose className="max-w-[560px] gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Search markets</DialogTitle>
        <DialogDescription className="sr-only">
          Search stocks, ETFs, cryptocurrencies, forex pairs, indices and commodities.
        </DialogDescription>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search symbols, names or categories…"
            className="h-12 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
            aria-label="Search markets"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="hotkey shrink-0">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[400px] overflow-y-auto p-1.5" role="listbox">
          <p className="px-2.5 pb-1.5 pt-2 text-3xs font-medium uppercase tracking-[0.08em] text-subtle">
            {query.trim() ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Popular markets"}
          </p>
          {results.length === 0 && (
            <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
              <Search className="h-5 w-5 text-subtle" />
              <p className="mt-1 text-[13px] font-medium text-foreground">No instruments found</p>
              <p className="text-xs text-muted">Try a ticker like NVDA, BTC or EUR/USD.</p>
            </div>
          )}
          {results.map((asset, index) => {
            const Icon = CLASS_ICONS[asset.class];
            const active = index === activeIndex;
            return (
              <button
                key={asset.id}
                type="button"
                role="option"
                aria-selected={active}
                data-result-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(asset.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                  active ? "bg-foreground/[0.06]" : "hover:bg-foreground/[0.035]",
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-subtle">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[13px] font-semibold tracking-tight text-foreground">
                      {asset.symbol}
                    </span>
                    <span className="truncate text-2xs text-subtle">{asset.name}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-3xs text-subtle">
                    <span>{ASSET_CLASS_LABELS[asset.class]}</span>
                    <span className="text-border-strong">·</span>
                    <span>{asset.exchange}</span>
                  </span>
                </span>
                <span className="hidden shrink-0 text-3xs text-subtle sm:block">{asset.currency}</span>
                {active && <CornerDownLeft className="h-3 w-3 shrink-0 text-subtle" />}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 px-4 py-2.5 text-3xs text-subtle">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="hotkey">↑</kbd>
              <kbd className="hotkey">↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="hotkey">↵</kbd>
              open chart
            </span>
          </span>
          <span className="font-mono">MERIDIAN SEARCH</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

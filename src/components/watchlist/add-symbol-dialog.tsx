"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchAssets } from "@/lib/market/assets";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import { useWatchlists } from "@/stores/watchlist-store";
import { cn } from "@/lib/utils";

const CLASS_FILTERS: Array<{ id: AssetClass | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "stock", label: "Stocks" },
  { id: "etf", label: "ETFs" },
  { id: "forex", label: "Forex" },
  { id: "index", label: "Indices" },
  { id: "commodity", label: "Commodities" },
];

export function AddSymbolDialog({
  open,
  onOpenChange,
  listId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId?: string;
}) {
  const lists = useWatchlists((state) => state.lists);
  const activeListId = useWatchlists((state) => state.activeListId);
  const addSymbol = useWatchlists((state) => state.addSymbol);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AssetClass | "all">("all");

  const targetId = listId ?? activeListId;
  const target = lists.find((list) => list.id === targetId) ?? lists[0];

  useEffect(() => {
    if (!open) {
      setQuery("");
      setFilter("all");
    }
  }, [open]);

  const results = useMemo(() => {
    const found = searchAssets(query, 60);
    return filter === "all" ? found : found.filter((asset) => asset.class === filter);
  }, [query, filter]);

  const add = (id: string, symbol: string) => {
    const result = addSymbol(id, targetId);
    if (result === "added") toast.success(`${symbol} added to ${target?.name ?? "watchlist"}`);
    else toast.message(`${symbol} is already in ${target?.name ?? "this watchlist"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <div className="p-5 pb-3">
          <DialogHeader>
            <DialogTitle>Add instruments</DialogTitle>
            <DialogDescription>
              Add to <span className="font-medium text-foreground">{target?.name ?? "watchlist"}</span>. You can
              keep the dialog open to add several at once.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search symbol, company or category…"
              className="pl-8"
              aria-label="Search instruments"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {CLASS_FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFilter(entry.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-2xs transition-colors",
                  filter === entry.id
                    ? "bg-brand/15 font-medium text-brand"
                    : "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[340px] border-t border-border">
          <div className="p-1.5">
            {results.length === 0 ? (
              <div className="flex flex-col items-center gap-1 px-4 py-10 text-center">
                <Search className="h-4 w-4 text-subtle" />
                <p className="text-xs font-medium text-foreground">No instruments found</p>
                <p className="text-2xs text-muted">Try a different ticker or category.</p>
              </div>
            ) : (
              results.map((asset) => {
                const exists = target?.symbols.includes(asset.id) ?? false;
                return (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-foreground/[0.035]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{asset.symbol}</span>
                        <span className="truncate text-2xs text-subtle">{asset.name}</span>
                      </div>
                      <p className="mt-0.5 text-3xs text-subtle">
                        {ASSET_CLASS_LABELS[asset.class]} · {asset.exchange} · {asset.currency}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant={exists ? "ghost" : "secondary"}
                      disabled={exists}
                      onClick={() => add(asset.id, asset.symbol)}
                      className="shrink-0"
                    >
                      {exists ? (
                        <>
                          <Check className="h-3 w-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-3xs text-subtle">
          <span>{target ? `${target.symbols.length} instruments in this list` : "No list selected"}</span>
          <Button size="sm" variant="secondary" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

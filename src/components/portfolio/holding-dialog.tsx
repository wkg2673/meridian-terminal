"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatCurrency, formatPrice } from "@/lib/format";
import { getAsset, searchAssets } from "@/lib/market/assets";
import { ASSET_CLASS_LABELS, type AssetClass } from "@/lib/market/types";
import { usePortfolio, type Holding } from "@/stores/portfolio-store";
import { cn } from "@/lib/utils";

interface HoldingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSymbol?: string;
  holding?: Holding;
}

export function HoldingDialog({ open, onOpenChange, initialSymbol, holding }: HoldingDialogProps) {
  const addHolding = usePortfolio((state) => state.addHolding);
  const updateHolding = usePortfolio((state) => state.updateHolding);
  const isEdit = Boolean(holding);

  const [symbol, setSymbol] = useState(initialSymbol ?? "BTCUSD");
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [avgPrice, setAvgPrice] = useState("");
  const [notes, setNotes] = useState("");

  const asset = getAsset(symbol);
  const { data: snapshotData } = useSnapshots(open && symbol ? [symbol] : [], 24);
  const quote = asset ? snapshotData?.snapshots[asset.symbol]?.quote : undefined;

  useEffect(() => {
    if (!open) return;
    setSymbol(holding?.symbol ?? initialSymbol ?? "BTCUSD");
    setQuery("");
    setQuantity(holding ? String(holding.quantity) : "1");
    setAvgPrice(holding ? String(holding.avgPrice) : "");
    setNotes(holding?.notes ?? "");
  }, [open, holding, initialSymbol]);

  useEffect(() => {
    if (!isEdit && !avgPrice && quote?.price) {
      setAvgPrice(quote.price.toFixed(quote.price >= 100 ? 2 : quote.price >= 1 ? 3 : 5));
    }
  }, [quote?.price, avgPrice, isEdit]);

  const results = useMemo(() => searchAssets(query, 40), [query]);

  const numericQuantity = Number.parseFloat(quantity.replace(/,/g, ""));
  const numericPrice = Number.parseFloat(avgPrice.replace(/,/g, ""));
  const valid = Boolean(asset) && Number.isFinite(numericQuantity) && numericQuantity > 0 && Number.isFinite(numericPrice) && numericPrice > 0;
  const positionValue = valid ? numericQuantity * numericPrice : 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || !asset) return;
    if (holding) {
      updateHolding(holding.id, {
        quantity: numericQuantity,
        avgPrice: numericPrice,
        notes: notes.trim() || undefined,
      });
      toast.success(`Updated ${asset.symbol} position`);
    } else {
      addHolding({
        symbol: asset.id,
        quantity: numericQuantity,
        avgPrice: numericPrice,
        notes: notes.trim() || undefined,
      });
      toast.success(`Added ${asset.symbol} to your portfolio`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit position" : "Add position"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the quantity or average cost. Prices are marked to the latest quote."
                : "Track a holding manually. Nothing is traded — this is a local position tracker."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="label-caps mb-1.5 block">Instrument</label>
              {isEdit && asset ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <span className="font-semibold text-foreground">{asset.symbol}</span>
                  <span className="truncate text-xs text-muted">{asset.name}</span>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-surface-2">
                  <div className="flex items-center gap-2 border-b border-border px-2.5">
                    <Search className="h-3.5 w-3.5 shrink-0 text-subtle" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search BTC, AAPL, EUR/USD…"
                      className="h-9 w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-subtle"
                      aria-label="Search instruments"
                    />
                  </div>
                  <ScrollArea className="max-h-36">
                    <div className="p-1">
                      {results.length === 0 && (
                        <p className="px-2 py-4 text-center text-2xs text-subtle">No instruments match.</p>
                      )}
                      {results.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => {
                            setSymbol(entry.id);
                            setAvgPrice("");
                            setQuery("");
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs transition-colors",
                            entry.id === symbol ? "bg-brand/10 text-brand" : "hover:bg-foreground/[0.05]",
                          )}
                        >
                          <span className="w-20 shrink-0 font-semibold">{entry.symbol}</span>
                          <span className="min-w-0 flex-1 truncate text-muted">{entry.name}</span>
                          <span className="shrink-0 text-3xs text-subtle">
                            {ASSET_CLASS_LABELS[entry.class as AssetClass]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                  {asset && (
                    <div className="flex items-center justify-between border-t border-border px-2.5 py-1.5 text-2xs">
                      <span className="font-medium text-foreground">
                        {asset.symbol} <span className="font-normal text-subtle">selected</span>
                      </span>
                      {quote && <span className="tnum text-muted">Last {formatPrice(quote.price, asset)}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="holding-quantity" className="label-caps mb-1.5 block">
                  Quantity
                </label>
                <Input
                  id="holding-quantity"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="1.0"
                />
              </div>
              <div>
                <label htmlFor="holding-price" className="label-caps mb-1.5 block">
                  Average cost
                </label>
                <Input
                  id="holding-price"
                  inputMode="decimal"
                  value={avgPrice}
                  onChange={(event) => setAvgPrice(event.target.value)}
                  placeholder={quote ? formatPrice(quote.price, asset) : "0.00"}
                />
              </div>
            </div>

            <div>
              <label htmlFor="holding-notes" className="label-caps mb-1.5 block">
                Notes <span className="normal-case tracking-normal text-subtle">(optional)</span>
              </label>
              <Input
                id="holding-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Thesis, entry setup…"
                maxLength={120}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-2/70 px-3 py-2">
              <span className="flex items-center gap-1.5 text-2xs text-muted">
                <Wallet className="h-3.5 w-3.5 text-subtle" />
                Position cost basis
              </span>
              <span className="tnum text-[13px] font-semibold text-foreground">
                {valid ? formatCurrency(positionValue) : "—"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!valid}>
              {isEdit ? "Save changes" : "Add position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

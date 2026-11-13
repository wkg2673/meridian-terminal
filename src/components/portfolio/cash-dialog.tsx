"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";

export function CashDialog({
  open,
  onOpenChange,
  current,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: number;
  onSave: (value: number) => void;
}) {
  const [value, setValue] = useState(String(current));

  useEffect(() => {
    if (open) setValue(String(current));
  }, [open, current]);

  const numeric = Number.parseFloat(value.replace(/,/g, ""));
  const valid = Number.isFinite(numeric) && numeric >= 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    onSave(numeric);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Cash balance</DialogTitle>
            <DialogDescription>
              Include uninvested cash so allocation and portfolio weights reflect your full available capital.
            </DialogDescription>
          </DialogHeader>
          <label htmlFor="portfolio-cash" className="label-caps mb-1.5 block">
            Available cash (USD)
          </label>
          <Input
            id="portfolio-cash"
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="25000"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-between text-2xs">
            <span className="text-subtle">Stored locally. No deposit or withdrawal is made.</span>
            <span className="tnum text-muted">{valid ? formatCurrency(numeric) : "—"}</span>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!valid}>
              Save balance
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

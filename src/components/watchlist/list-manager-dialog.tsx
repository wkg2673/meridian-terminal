"use client";

import { useEffect, useState } from "react";
import { Check, ListPlus, RotateCcw, Trash2 } from "lucide-react";
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
import { useWatchlists } from "@/stores/watchlist-store";
import { cn } from "@/lib/utils";

export function ListManagerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const lists = useWatchlists((state) => state.lists);
  const activeListId = useWatchlists((state) => state.activeListId);
  const setActiveList = useWatchlists((state) => state.setActiveList);
  const renameList = useWatchlists((state) => state.renameList);
  const deleteList = useWatchlists((state) => state.deleteList);
  const createList = useWatchlists((state) => state.createList);
  const restoreDefaults = useWatchlists((state) => state.restoreDefaults);

  const active = lists.find((list) => list.id === activeListId) ?? lists[0];
  const [name, setName] = useState(active?.name ?? "");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    setName(active?.name ?? "");
  }, [active?.id, active?.name, open]);

  const commitRename = () => {
    if (!active || !name.trim() || name.trim() === active.name) return;
    renameList(active.id, name);
    toast.success("Watchlist renamed");
  };

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    createList(newName);
    setNewName("");
    setName(newName.trim() || "New watchlist");
    toast.success("Watchlist created");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage watchlists</DialogTitle>
          <DialogDescription>
            Organize instruments into separate lists. Everything is stored locally in this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="label-caps mb-1.5">Your lists</p>
            <div className="space-y-1">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
                    list.id === activeListId ? "border-brand/30 bg-brand/[0.06]" : "border-border bg-surface-2/50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveList(list.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        list.id === activeListId ? "border-brand bg-brand text-white" : "border-border-strong",
                      )}
                    >
                      {list.id === activeListId && <Check className="h-2.5 w-2.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-foreground">{list.name}</span>
                      <span className="block text-3xs text-subtle">{list.symbols.length} instruments</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteList(list.id);
                      toast.message(`${list.name} deleted`);
                    }}
                    disabled={lists.length <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-subtle transition-colors hover:bg-bearish/10 hover:text-bearish disabled:pointer-events-none disabled:opacity-40"
                    aria-label={`Delete ${list.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="rename-list" className="label-caps mb-1.5 block">
              Rename active list
            </label>
            <div className="flex gap-2">
              <Input
                id="rename-list"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={40}
                placeholder="Watchlist name"
              />
              <Button type="button" size="sm" variant="secondary" onClick={commitRename} disabled={!name.trim()}>
                Save
              </Button>
            </div>
          </div>

          <form onSubmit={create}>
            <label htmlFor="new-list" className="label-caps mb-1.5 block">
              New watchlist
            </label>
            <div className="flex gap-2">
              <Input
                id="new-list"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={40}
                placeholder="e.g. Macro hedges"
              />
              <Button type="submit" size="sm" variant="secondary">
                <ListPlus className="h-3.5 w-3.5" />
                Create
              </Button>
            </div>
          </form>

          <div className="flex items-center justify-between rounded-lg border border-dashed border-border px-3 py-2">
            <div>
              <p className="text-2xs font-medium text-foreground">Restore default lists</p>
              <p className="text-3xs text-subtle">Brings back Core, Digital Assets and US Equities.</p>
            </div>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={() => {
                restoreDefaults();
                toast.success("Default watchlists restored");
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

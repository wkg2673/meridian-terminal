"use client";

import { Command, Keyboard, MousePointerClick, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUi } from "@/stores/ui-store";

const GROUPS: Array<{ title: string; icon: typeof Keyboard; items: Array<[string, string]> }> = [
  {
    title: "Navigation",
    icon: Command,
    items: [
      ["⌘ K / Ctrl K", "Search markets"],
      ["?", "Keyboard shortcuts"],
      ["[ / ]", "Previous / next watchlist asset"],
    ],
  },
  {
    title: "Chart",
    icon: MousePointerClick,
    items: [
      ["1 – 9", "Switch timeframe"],
      ["G", "Toggle chart grid"],
      ["L", "Pause / resume live data"],
      ["Shift R", "Reset zoom"],
      ["Esc", "Cancel drawing tool"],
    ],
  },
  {
    title: "Drawing",
    icon: Star,
    items: [
      ["V", "Cursor / select"],
      ["T", "Trend line"],
      ["H", "Horizontal line"],
      ["R", "Rectangle"],
      ["F", "Fibonacci retracement"],
      ["Delete", "Remove selected drawing"],
    ],
  },
];

export function ShortcutsDialog() {
  const open = useUi((state) => state.shortcutsOpen);
  const setOpen = useUi((state) => state.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-brand" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>
            Built for fast keyboard-driven analysis. Shortcuts are disabled while typing in an input.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <p className="label-caps mb-2 flex items-center gap-1.5">
                <group.icon className="h-3 w-3" />
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map(([keys, label]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs odd:bg-foreground/[0.025]">
                    <span className="text-muted">{label}</span>
                    <kbd className="hotkey shrink-0">{keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-border pt-3 text-3xs text-subtle">
          Drawing shortcuts place the tool in “armed” mode. Click on the chart to draw, then press Esc to
          return to the cursor.
        </p>
      </DialogContent>
    </Dialog>
  );
}

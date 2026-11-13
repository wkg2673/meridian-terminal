"use client";

import { useEffect } from "react";
import { useTerminal } from "@/stores/terminal-store";
import { useWatchlists } from "@/stores/watchlist-store";
import { usePreferences } from "@/stores/preferences-store";
import { useUi } from "@/stores/ui-store";
import { TIMEFRAMES } from "@/lib/market/types";
import { toast } from "sonner";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

export function useGlobalShortcuts() {
  const setSearchOpen = useUi((state) => state.setSearchOpen);
  const setShortcutsOpen = useUi((state) => state.setShortcutsOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (isTypingTarget(event.target)) return;
      if (event.key === "?" && !meta) {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen, setShortcutsOpen]);
}

export function useTerminalShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;

      const terminal = useTerminal.getState();
      const timeframe = TIMEFRAMES[Number.parseInt(event.key, 10) - 1];

      if (timeframe) {
        terminal.setTimeframe(timeframe.id);
        return;
      }

      if (event.shiftKey && event.key.toLowerCase() === "r") {
        window.dispatchEvent(new CustomEvent("meridian:reset-chart"));
        return;
      }

      switch (event.key.toLowerCase()) {
        case "g": {
          const grid = usePreferences.getState().chartGrid;
          usePreferences.getState().setChartGrid(!grid);
          toast.message(grid ? "Chart grid hidden" : "Chart grid shown", { duration: 1200 });
          break;
        }
        case "l": {
          const live = terminal.liveUpdates;
          terminal.setLiveUpdates(!live);
          toast.message(live ? "Live updates paused" : "Live updates resumed", { duration: 1200 });
          break;
        }
        case "v":
          terminal.setActiveTool("cursor");
          break;
        case "t":
          terminal.setActiveTool("trendline");
          break;
        case "h":
          terminal.setActiveTool("horizontal");
          break;
        case "r":
          terminal.setActiveTool("rectangle");
          break;
        case "f":
          terminal.setActiveTool("fib");
          break;
        case "[": {
          const watchlists = useWatchlists.getState();
          const active = watchlists.lists.find((list) => list.id === watchlists.activeListId);
          if (active?.symbols.length) {
            const index = active.symbols.indexOf(terminal.symbol);
            const next = active.symbols[(index - 1 + active.symbols.length) % active.symbols.length];
            terminal.setSymbol(next);
          }
          break;
        }
        case "]": {
          const watchlists = useWatchlists.getState();
          const active = watchlists.lists.find((list) => list.id === watchlists.activeListId);
          if (active?.symbols.length) {
            const index = active.symbols.indexOf(terminal.symbol);
            const next = active.symbols[(index + 1) % active.symbols.length];
            terminal.setSymbol(next);
          }
          break;
        }
        case "delete":
        case "backspace":
          if (terminal.selectedDrawingId) {
            terminal.removeDrawing(terminal.selectedDrawingId);
          }
          break;
        case "escape":
          if (terminal.activeTool !== "cursor") terminal.setActiveTool("cursor");
          else terminal.selectDrawing(null);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

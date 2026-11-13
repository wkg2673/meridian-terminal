"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ChartToolbar } from "@/components/chart/chart-toolbar";
import { DrawingRail } from "@/components/chart/drawing-rail";
import { PriceChart } from "@/components/chart/price-chart";
import { SymbolHeader } from "@/components/terminal/symbol-header";
import { AssetDetailsPanel, WatchlistPanel } from "@/components/terminal/watchlist-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useTerminalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTerminal } from "@/stores/terminal-store";
import { clamp } from "@/lib/utils";

const MIN_PANEL = 280;
const MAX_PANEL = 560;

export default function TerminalPage() {
  useTerminalShortcuts();
  const rightPanelOpen = useTerminal((state) => state.rightPanelOpen);
  const rightPanelWidth = useTerminal((state) => state.rightPanelWidth);
  const setRightPanelWidth = useTerminal((state) => state.setRightPanelWidth);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const onMove = (moveEvent: PointerEvent) => {
      setRightPanelWidth(clamp(window.innerWidth - moveEvent.clientX, MIN_PANEL, MAX_PANEL));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  const resizeWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? 16 : -16;
    setRightPanelWidth(clamp(rightPanelWidth + delta, MIN_PANEL, MAX_PANEL));
  };

  return (
    <div className="flex h-full min-h-0 bg-background">
      <DrawingRail />

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col" id="meridian-chart-pane">
        <SymbolHeader />
        <ChartToolbar />
        <PriceChart />
        <button
          type="button"
          onClick={() => setMobilePanelOpen(true)}
          className="absolute right-3 top-[72px] z-20 flex h-8 items-center gap-1.5 rounded-lg border border-border bg-elevated/95 px-2.5 text-2xs font-medium text-foreground shadow-popover backdrop-blur md:hidden"
        >
          <Star className="h-3.5 w-3.5 text-amber-400" />
          Watchlist
        </button>
      </div>

      {rightPanelOpen && (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize side panel"
            aria-valuemin={MIN_PANEL}
            aria-valuemax={MAX_PANEL}
            aria-valuenow={Math.round(rightPanelWidth)}
            tabIndex={0}
            onPointerDown={startResize}
            onKeyDown={resizeWithKeyboard}
            className="hidden w-[3px] shrink-0 cursor-col-resize touch-none bg-border/60 transition-colors hover:bg-brand/60 focus-visible:bg-brand focus-visible:outline-none md:block"
          />
          <aside
            className="hidden min-h-0 shrink-0 flex-col border-l border-border bg-surface md:flex"
            style={{ width: rightPanelWidth }}
            aria-label="Watchlist and instrument details"
          >
            <WatchlistPanel />
            <AssetDetailsPanel />
          </aside>
        </>
      )}

      <Dialog open={mobilePanelOpen} onOpenChange={setMobilePanelOpen}>
        <DialogContent className="flex h-[85dvh] max-w-md flex-col gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">Watchlist and instrument details</DialogTitle>
          <div className="flex min-h-0 flex-1 flex-col">
            <WatchlistPanel />
            <AssetDetailsPanel />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

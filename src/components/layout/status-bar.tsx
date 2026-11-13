"use client";

import { useEffect, useState } from "react";
import { Activity, Keyboard } from "lucide-react";
import { useDataStatus } from "@/hooks/use-market-data";
import { requireAsset } from "@/lib/market/assets";
import { getMarketStatus } from "@/lib/market/market-status";
import { useUi } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function StatusBar() {
  const { data } = useDataStatus();
  const setShortcutsOpen = useUi((state) => state.setShortcutsOpen);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(interval);
  }, []);

  const mode = data?.mode ?? "demo";
  const market = getMarketStatus(requireAsset("SPX"), now ? new Date(now) : new Date());
  const sessionOpen = market.state === "open" || market.state === "24-7";

  return (
    <footer className="z-30 hidden h-[26px] shrink-0 items-center justify-between border-t border-border bg-surface px-3 text-3xs text-subtle sm:flex">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-pulse-dot rounded-full",
                mode === "demo" ? "bg-warning" : "bg-bullish",
              )}
            />
            <span
              className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", mode === "demo" ? "bg-warning" : "bg-bullish")}
            />
          </span>
          <span className="font-medium text-muted">
            {mode === "demo" ? "Simulated market data" : "Delayed provider data"}
          </span>
        </span>
        <span className="hidden items-center gap-1.5 md:flex">
          <Activity className="h-2.5 w-2.5" />
          {data?.configured.length ? data.configured.join(" · ") : "Meridian Simulation Engine"}
        </span>
        <span className="hidden lg:flex">OHLC · Volume · 9 timeframes</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className={cn("h-1.5 w-1.5 rounded-full", sessionOpen ? "bg-bullish" : "bg-subtle")} />
          US session {now ? market.label : "—"}
        </span>
        <span className="tnum tabular-nums">New York {now ? timeFormatter.format(now) : "—"}</span>
        <button
          type="button"
          onClick={() => setShortcutsOpen(true)}
          className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:text-foreground"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="h-2.5 w-2.5" />
          Shortcuts
          <kbd className="rounded border border-border bg-surface-2 px-1 font-mono text-3xs">?</kbd>
        </button>
      </div>
    </footer>
  );
}

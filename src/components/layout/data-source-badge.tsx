"use client";

import { CircleHelp, Database, Radio, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useDataStatus } from "@/hooks/use-market-data";
import { cn } from "@/lib/utils";

export function DataSourceBadge({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError } = useDataStatus();
  const mode = isError ? "demo" : data?.mode ?? "demo";
  const isDemo = mode === "demo";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-3xs font-semibold uppercase tracking-[0.06em] transition-colors",
            isDemo
              ? "border-warning/25 bg-warning/[0.07] text-warning hover:bg-warning/10"
              : "border-brand/25 bg-brand/[0.07] text-brand hover:bg-brand/10",
          )}
          aria-label="Market data source"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-pulse-dot rounded-full",
                isDemo ? "bg-warning" : "bg-brand",
              )}
            />
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", isDemo ? "bg-warning" : "bg-brand")} />
          </span>
          {compact ? (isDemo ? "Demo" : "Delayed") : isLoading ? "Data" : isDemo ? "Demo data" : "Delayed data"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[320px] p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            {isDemo ? <WifiOff className="h-3.5 w-3.5 text-warning" /> : <Radio className="h-3.5 w-3.5 text-brand" />}
            <p className="text-xs font-semibold text-foreground">
              {isDemo ? "Demonstration market data" : "Provider data connected"}
            </p>
          </div>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted">
            {isError
              ? "The data-status service is unreachable, so the terminal is falling back to locally simulated prices."
              : data?.message ??
                "Checking which market-data providers are configured for this deployment."}
          </p>
        </div>
        <div className="space-y-2 px-4 py-3">
          <p className="label-caps">Data sources</p>
          {(data?.providers ?? []).map((provider) => (
            <div key={provider.name} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                  provider.configured ? "bg-bullish" : "bg-border-strong",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-2xs font-medium text-foreground">
                  {provider.label}
                  {provider.configured && (
                    <span className="ml-1.5 font-normal text-bullish">configured</span>
                  )}
                </p>
                <p className="text-3xs leading-relaxed text-subtle">{provider.description}</p>
              </div>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-start gap-2 px-4 py-3">
          <CircleHelp className="mt-0.5 h-3 w-3 shrink-0 text-subtle" />
          <p className="text-3xs leading-relaxed text-subtle">
            Quotes, candles and sparklines are clearly tagged with their source. Add provider credentials
            to <span className="font-mono text-muted">.env.local</span> to enable provider data.
          </p>
        </div>
        <div className="flex items-center gap-1.5 border-t border-border px-4 py-2 text-3xs text-subtle">
          <Database className="h-3 w-3" />
          <span>Simulation engine v1 · deterministic OHLC</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

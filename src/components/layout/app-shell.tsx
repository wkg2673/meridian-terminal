"use client";

import { usePathname } from "next/navigation";
import { CommandSearch } from "@/components/layout/command-search";
import { ShortcutsDialog } from "@/components/layout/shortcuts-dialog";
import { StatusBar } from "@/components/layout/status-bar";
import { TickerTape } from "@/components/layout/ticker-tape";
import { TopNav } from "@/components/layout/top-nav";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTerminal = pathname === "/";
  useGlobalShortcuts();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-xs focus:text-white"
      >
        Skip to content
      </a>
      <TopNav />
      <TickerTape />
      <main
        id="main-content"
        className={cn("min-h-0 flex-1", isTerminal ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden")}
      >
        {children}
      </main>
      <StatusBar />
      <CommandSearch />
      <ShortcutsDialog />
    </div>
  );
}

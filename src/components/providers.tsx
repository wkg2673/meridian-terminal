"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePreferences } from "@/stores/preferences-store";
import { usePortfolio } from "@/stores/portfolio-store";
import { useTerminal } from "@/stores/terminal-store";
import { useWatchlists } from "@/stores/watchlist-store";
import { useResolvedTheme } from "@/hooks/use-theme";

function StoreHydrator() {
  useEffect(() => {
    void usePreferences.persist.rehydrate();
    void useTerminal.persist.rehydrate();
    void useWatchlists.persist.rehydrate();
    void usePortfolio.persist.rehydrate();
  }, []);
  return null;
}

function ThemeController() {
  const theme = usePreferences((state) => state.theme);
  const reduceMotion = usePreferences((state) => state.reduceMotion);
  const resolved = useResolvedTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    root.classList.toggle("reduce-motion", reduceMotion);
  }, [resolved, reduceMotion, theme]);

  return null;
}

function ThemedToaster() {
  const resolved = useResolvedTheme();
  return (
    <Toaster
      theme={resolved}
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!bg-surface !border-border !text-foreground !rounded-xl !shadow-popover !font-sans !text-[13px]",
          description: "!text-muted",
          actionButton: "!bg-brand !text-white",
          cancelButton: "!bg-surface-2 !text-muted",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
            staleTime: 3_000,
            gcTime: 10 * 60_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250} skipDelayDuration={100}>
        <StoreHydrator />
        <ThemeController />
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

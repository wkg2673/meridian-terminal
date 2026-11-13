"use client";

import { useSyncExternalStore } from "react";
import { usePreferences } from "@/stores/preferences-store";

export function useSystemTheme(): "dark" | "light" {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => undefined;
      const query = window.matchMedia("(prefers-color-scheme: dark)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    () => "dark",
  );
}

export function useResolvedTheme(): "dark" | "light" {
  const theme = usePreferences((state) => state.theme);
  const system = useSystemTheme();
  return theme === "system" ? system : theme;
}

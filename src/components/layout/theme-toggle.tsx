"use client";

import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useResolvedTheme } from "@/hooks/use-theme";
import { usePreferences } from "@/stores/preferences-store";

export function ThemeToggle({ className }: { className?: string }) {
  const resolved = useResolvedTheme();
  const setTheme = usePreferences((state) => state.setTheme);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/[0.055] hover:text-foreground focus-visible:outline-none"
          aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        >
          <Sun
            className={`absolute h-4 w-4 transition-all duration-300 ${
              resolved === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <Moon
            className={`absolute h-4 w-4 transition-all duration-300 ${
              resolved === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>{resolved === "dark" ? "Light theme" : "Dark theme"}</TooltipContent>
    </Tooltip>
  );
}

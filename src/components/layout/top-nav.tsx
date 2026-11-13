"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CandlestickChart,
  Command,
  Globe2,
  Keyboard,
  LogOut,
  Menu,
  Newspaper,
  Search,
  Settings2,
  Star,
  Wallet,
  X,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { DataSourceBadge } from "@/components/layout/data-source-badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePreferences, type ThemeMode } from "@/stores/preferences-store";
import { useUi } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ href: string; label: string; description: string; icon: LucideIcon }> = [
  { href: "/", label: "Terminal", description: "Advanced charting workspace", icon: CandlestickChart },
  { href: "/markets", label: "Markets", description: "Global market overview", icon: Globe2 },
  { href: "/watchlists", label: "Watchlists", description: "Track your instruments", icon: Star },
  { href: "/portfolio", label: "Portfolio", description: "Positions and performance", icon: Wallet },
  { href: "/news", label: "News", description: "Market news and sentiment", icon: Newspaper },
];

const THEMES: Array<{ value: ThemeMode; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

export function TopNav() {
  const pathname = usePathname();
  const setSearchOpen = useUi((state) => state.setSearchOpen);
  const mobileNavOpen = useUi((state) => state.mobileNavOpen);
  const setMobileNavOpen = useUi((state) => state.setMobileNavOpen);
  const setShortcutsOpen = useUi((state) => state.setShortcutsOpen);
  const theme = usePreferences((state) => state.theme);
  const setTheme = usePreferences((state) => state.setTheme);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface/85 px-3 backdrop-blur-xl md:px-4">
      <div className="flex items-center gap-6">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex h-14 items-center px-2.5 text-[13px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-t-full bg-brand shadow-[0_0_10px_hsl(var(--brand)/0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="group hidden h-8 w-48 items-center gap-2 rounded-lg border border-border bg-surface-2/80 px-2.5 text-left text-xs text-subtle transition-colors hover:border-border-strong hover:text-muted md:flex xl:w-64"
          aria-label="Open market search"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">Search markets…</span>
          <kbd className="hotkey pointer-events-none gap-0.5 px-1 text-3xs">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </button>

        <div className="hidden xl:block">
          <DataSourceBadge />
        </div>

        <ThemeToggle className="hidden sm:flex" />

        <Link
          href="/settings"
          className="hidden h-8 w-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-foreground/[0.055] hover:text-foreground sm:flex"
          aria-label="Settings"
        >
          <Settings2 className="h-4 w-4" />
        </Link>

        <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 items-center gap-2 rounded-full pl-0.5 pr-1.5 transition-colors hover:bg-foreground/[0.055]"
              aria-label="Account menu"
            >
              <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-2xs font-semibold text-white">
                AM
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-surface bg-bullish" />
              </span>
              <span className="hidden text-left xl:block">
                <span className="block text-2xs font-medium leading-tight text-foreground">Alex Morgan</span>
                <span className="block text-3xs leading-tight text-subtle">Local profile</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <span className="block text-xs font-medium text-foreground">Alex Morgan</span>
              <span className="mt-0.5 block text-3xs font-normal text-subtle">alex@meridian.local</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info("Sign-in and cloud sync are not configured in this build.")}>
              <UserRound />
              Profile
              <span className="ml-auto text-3xs text-subtle">Local</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings2 />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/portfolio">
                <Wallet />
                Portfolio
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
                  {THEMES.map((entry) => (
                    <DropdownMenuRadioItem key={entry.value} value={entry.value}>
                      {entry.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onSelect={() => setShortcutsOpen(true)}>
              <Keyboard />
              Keyboard shortcuts
              <span className="ml-auto font-mono text-3xs text-subtle">?</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => toast.info("Authentication is not enabled. Preferences are stored locally in your browser.")}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
            <div className="px-2 pb-1 pt-2 text-3xs text-subtle">
              Data and preferences stay on this device.
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon-sm"
          className="md:hidden"
          onClick={() => setSearchOpen(true)}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-x-0 top-14 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 top-14 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-x-0 top-0 animate-fade-up border-b border-border bg-surface p-3 shadow-popover">
            <nav className="grid gap-0.5" aria-label="Mobile">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      active ? "bg-foreground/[0.05]" : "hover:bg-foreground/[0.035]",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "text-brand" : "text-subtle")} />
                    <span className="flex-1">
                      <span className={cn("block text-[13px] font-medium", active ? "text-foreground" : "text-muted")}>
                        {item.label}
                      </span>
                      <span className="block text-3xs text-subtle">{item.description}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
              <DataSourceBadge />
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Link
                  href="/settings"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-foreground/[0.055] hover:text-foreground"
                  aria-label="Settings"
                >
                  <Settings2 className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

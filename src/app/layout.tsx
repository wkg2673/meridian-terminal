import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Meridian Terminal — Markets, charts and portfolio",
    template: "%s · Meridian Terminal",
  },
  description:
    "A professional-grade market terminal with interactive charts, watchlists, portfolio tracking and global market coverage across crypto, equities, FX, indices and commodities.",
  applicationName: "Meridian Terminal",
  keywords: ["trading terminal", "charts", "watchlists", "portfolio", "markets"],
  authors: [{ name: "Meridian" }],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d10" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
  ],
};

const THEME_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("meridian.preferences");
    var parsed = raw ? JSON.parse(raw) : null;
    var theme = (parsed && parsed.state && parsed.state.theme) || "dark";
    var dark = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
  } catch (error) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

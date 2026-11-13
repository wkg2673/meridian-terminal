<div align="center">

# Meridian Terminal

A TradingView-inspired market terminal built with Next.js, React, TypeScript, Tailwind CSS and Lightweight Charts. Dark-first, keyboard-friendly and fully functional — every control does something.

> **Data disclosure:** with no provider credentials the app runs in **demo mode**. Prices, candles, sparklines and the newsroom are generated or written locally and are explicitly labelled **DEMO**. They are not real market data and must not be used for trading decisions.

</div>

<img width="3439" height="1439" alt="image" src="https://github.com/user-attachments/assets/cbaafaf4-5f56-4dc3-8d63-eaba9c5b2a19" />

## Highlights

- **Terminal workspace** — drawing rail, interactive chart, watchlist and asset details in a resizable three-column layout with collapsible panels.
- **Charts** — candlesticks, bars, line and area; volume histogram sub-pane; crosshair with OHLC legend; zoom/pan; price line; 1m → 1M timeframes.
- **Indicators** — SMA, EMA, Bollinger Bands, RSI and MACD rendered in native Lightweight Charts panes, plus a volume pane. All parameters are configurable and persisted.
- **Drawings** — trend line, horizontal line, vertical line, rectangle, text annotation and Fibonacci retracement. Select, drag endpoints, recolour, delete or clear. Drawings persist per instrument.
- **Watchlists** — multiple lists, add/remove/reorder symbols, search, sortable columns, sparklines and live market-session status. Persisted locally.
- **Portfolio** — add/edit/delete positions, cash balance, sample holdings, allocation donut, intraday performance chart, P/L and exposure metrics. Persisted locally.
- **Markets overview** — S&P 500, NASDAQ, Dow, DAX, Bitcoin, Ethereum, Gold and EUR/USD cards, plus cross-asset tables.
- **Global search** — `⌘K` / `Ctrl K` across crypto, equities, ETFs, FX, indices and commodities.
- **Newsroom** — filters, featured story, sentiment sidebar, trending tickers and article reader. Articles are fictional demo content.
- **Settings** — theme, chart defaults, indicator defaults, sparkline/tape/precision preferences, provider status and data reset.
- **UX polish** — dark/light themes persisted across sessions, toasts, loading/empty/error states, keyboard shortcuts, responsive desktop-first layouts.

## Getting started

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Start the development server             |
| `npm run build`     | Production build                         |
| `npm run start`     | Serve the production build               |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |

## Market data providers

Configuration lives in `.env.local`; copy `.env.example` to get started. Keys are read server-side only.

| Variable               | Provider    | Used for                                              |
| ---------------------- | ----------- | ----------------------------------------------------- |
| `TWELVE_DATA_API_KEY`  | Twelve Data | Multi-asset quotes and time series                    |
| `FINNHUB_API_KEY`      | Finnhub     | US equity quotes, crypto candles                      |
| `COINGECKO_API_KEY`    | CoinGecko   | Crypto prices, 24h stats and OHLC history             |
| `MARKET_DATA_MODE`     | —           | Set to `demo` to force simulated data                 |

**Fallback chain:** each asset is routed to the providers that support its class. If a provider call fails, returns no usable history, or no credentials are configured, the request falls back to the deterministic simulation engine. The active mode (`demo` / `delayed`) and per-provider status are shown in the top nav, status bar and Settings → Data.

Data timestamps are always rendered next to quotes and charts. Provider entitlements decide whether quotes are real-time or delayed; the app never claims real-time data it does not have.

### Demo engine

`src/lib/market/simulation.ts` generates prices from multi-octave value noise seeded by instrument, timeframe and time bucket, then normalises to realistic anchor prices from the asset catalog. This keeps prices coherent across pages and timeframes, and stable enough for screenshots while still updating over time.

## Architecture

```
src/
  app/                     App Router pages and /api/market route handlers
    api/market/            quotes · candles · snapshots · status
    (pages)                / · /markets · /watchlists · /portfolio · /news · /settings
  components/
    brand/                 Logo
    chart/                 PriceChart, toolbar, drawing rail
    layout/                Top nav, ticker tape, search, status bar, shortcuts
    portfolio/             Holding/cash dialogs, allocation, performance
    terminal/              Symbol header, watchlist/details panel
    ui/                    shadcn-style primitives (Radix + Tailwind)
    watchlist/             Add-symbol and list-manager dialogs
  hooks/                   Market data, portfolio metrics, theme, shortcuts
  lib/
    market/                Asset catalog, simulation, service, providers, client
    chart/                 Indicator math and chart theme
    news.ts                Fictional demo newsroom
    format.ts, utils.ts    Formatting helpers
  stores/                  Zustand stores (preferences, terminal, watchlists, portfolio, UI)
```

### Data flow

```
Client components ──► /api/market/* ──► provider adapters ──► demo fallback
        │                    │
        └── TanStack Query cache + in-memory TTL cache (server)
```

- Server-side cache has short TTLs per endpoint to stay inside provider rate limits.
- Zustand stores use `persist` with `skipHydration`; a `StoreHydrator` rehydrates on mount to avoid SSR mismatches. The theme is bootstrapped by an inline script for no-flash first paint.
- Storage keys: `meridian.preferences`, `meridian.terminal`, `meridian.watchlists`, `meridian.portfolio`.

### Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 3 · Zustand 5 · TanStack Query 5 · Lightweight Charts 5 · Radix UI · lucide-react · sonner · @fontsource-variable (Inter, JetBrains Mono).

## Keyboard shortcuts

Press `?` in the app for the full list.

| Keys              | Action                              |
| ----------------- | ----------------------------------- |
| `⌘K` / `Ctrl K`   | Global search                       |
| `?`               | Keyboard shortcuts dialog           |
| `[` / `]`         | Previous / next watchlist asset     |
| `1`–`9`           | Switch timeframe                    |
| `G`               | Toggle chart grid                   |
| `L`               | Pause / resume live data            |
| `Shift R`         | Reset zoom                          |
| `V` / `T` / `H`   | Cursor / trend line / horizontal    |
| `R` / `F`         | Rectangle / Fibonacci               |
| `Delete`          | Remove selected drawing             |
| `Esc`             | Cancel tool / clear selection       |

## Disclosures

- **Prices and charts** are simulated unless valid provider keys are configured.
- **News articles, authors and tickers** in `/news` are fictional and written for demonstration.
- **Portfolio sample holdings** are illustrative and flagged as samples; they can be cleared or restored.
- No order execution, brokerage connection or financial advice is provided. This is a UI/engineering demonstration.

---

###### Made by wkg2673, built with OpenCode.

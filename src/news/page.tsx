"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Clock3,
  Flame,
  Info,
  Newspaper,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/ui/change-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader, Stat } from "@/components/ui/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkline } from "@/components/ui/sparkline";
import { useSnapshots } from "@/hooks/use-market-data";
import { formatDateTime, formatPrice, formatTimeAgo } from "@/lib/format";
import { getAsset } from "@/lib/market/assets";
import {
  DEMO_NEWS,
  NEWS_CATEGORIES,
  SENTIMENT_LABELS,
  TRENDING_TICKERS,
  type NewsArticle,
  type NewsCategory,
  type NewsSentiment,
} from "@/lib/news";
import { useTerminal } from "@/stores/terminal-store";
import { cn } from "@/lib/utils";

const SENTIMENTS: Array<{ id: NewsSentiment | "all"; label: string }> = [
  { id: "all", label: "All sentiment" },
  { id: "bullish", label: "Bullish" },
  { id: "bearish", label: "Bearish" },
  { id: "neutral", label: "Neutral" },
];

const CATEGORY_STYLES: Record<NewsCategory, string> = {
  markets: "text-brand",
  crypto: "text-amber-400",
  stocks: "text-violet-400",
  forex: "text-cyan-400",
  commodities: "text-orange-400",
  macro: "text-emerald-400",
};

export default function NewsPage() {
  const router = useRouter();
  const setSymbol = useTerminal((state) => state.setSymbol);
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [sentiment, setSentiment] = useState<NewsSentiment | "all">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<NewsArticle | null>(null);

  const tickersQuery = useSnapshots(TRENDING_TICKERS, 28);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DEMO_NEWS.filter((article) => {
      if (category !== "all" && article.category !== category) return false;
      if (sentiment !== "all" && article.sentiment !== sentiment) return false;
      if (!needle) return true;
      return (
        article.title.toLowerCase().includes(needle) ||
        article.summary.toLowerCase().includes(needle) ||
        article.source.toLowerCase().includes(needle) ||
        article.tickers.some((ticker) => ticker.toLowerCase().includes(needle))
      );
    }).sort((a, b) => b.publishedAt - a.publishedAt);
  }, [category, sentiment, query]);

  const hasFilters = category !== "all" || sentiment !== "all" || query.trim().length > 0;
  const featured = hasFilters ? undefined : DEMO_NEWS.find((article) => article.featured);
  const stories = featured ? filtered.filter((article) => article.id !== featured.id) : filtered;

  const counts = useMemo(() => {
    return DEMO_NEWS.reduce(
      (acc, article) => {
        acc[article.sentiment] += 1;
        return acc;
      },
      { bullish: 0, bearish: 0, neutral: 0 } as Record<NewsSentiment, number>,
    );
  }, []);

  const latest = Math.max(...DEMO_NEWS.map((article) => article.publishedAt));
  const sourceCount = new Set(DEMO_NEWS.map((article) => article.source)).size;

  const openTicker = (id: string) => {
    setSymbol(id);
    setSelected(null);
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6 px-4 py-6 md:px-6 lg:px-8">
      <PageHeader
        eyebrow="Market intelligence"
        title="Newsroom"
        description="A demonstration newsroom for the terminal. Browse fictional market stories, follow the narrative around an instrument and jump straight into its chart."
        actions={
          <>
            <Badge variant="warning" size="md">
              <Sparkles className="h-3 w-3" />
              Demo content
            </Badge>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/markets">
                Market overview
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.045] p-3.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-warning/25 bg-warning/10 text-warning">
          <Info className="h-3.5 w-3.5" />
        </span>
        <div>
          <p className="text-xs font-medium text-foreground">Illustrative newsroom — not real reporting</p>
          <p className="mt-0.5 max-w-3xl text-2xs leading-relaxed text-muted">
            Every story below is fictional demonstration content created for this product build. Sources, authors
            and events are invented. Nothing here should be used for trading or investment decisions.
          </p>
        </div>
      </div>

      <section aria-label="News summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="panel p-3.5">
          <Stat label="Stories" value={DEMO_NEWS.length} hint={`${sourceCount} fictional desks`} />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Bullish stories"
            value={counts.bullish}
            hint={`${counts.bearish} bearish · ${counts.neutral} neutral`}
            tone="up"
          />
        </div>
        <div className="panel p-3.5">
          <Stat
            label="Net tone"
            value={counts.bullish >= counts.bearish ? "Constructive" : "Cautious"}
            hint="Aggregate of fictional story labels"
            tone={counts.bullish >= counts.bearish ? "up" : "down"}
          />
        </div>
        <div className="panel p-3.5">
          <Stat label="Latest story" value={formatTimeAgo(latest)} hint={formatDateTime(latest)} tone="muted" />
        </div>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_296px]">
        <div className="min-w-0 space-y-4">
          <div className="panel p-3">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search stories, sources or tickers…"
                  className="h-8 pl-8 text-xs"
                  aria-label="Search news"
                />
              </div>
              <select
                value={sentiment}
                onChange={(event) => setSentiment(event.target.value as NewsSentiment | "all")}
                className="h-8 rounded-md border border-border bg-surface-2 px-2 text-xs text-foreground outline-none focus-visible:border-brand/60"
                aria-label="Filter by sentiment"
              >
                {SENTIMENTS.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="no-scrollbar mt-2.5 flex items-center gap-1 overflow-x-auto">
              {NEWS_CATEGORIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setCategory(entry.id)}
                  className={cn(
                    "shrink-0 rounded-md px-2.5 py-1 text-2xs transition-colors",
                    category === entry.id
                      ? "bg-brand/15 font-medium text-brand"
                      : "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          {featured && (
            <button
              type="button"
              onClick={() => setSelected(featured)}
              className="group panel relative w-full overflow-hidden p-5 text-left transition-all hover:border-border-strong hover:shadow-panel"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.09] via-transparent to-violet-500/[0.04]" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="brand" size="md">
                    <Flame className="h-3 w-3" />
                    Top story
                  </Badge>
                  <Badge variant="outline" className={CATEGORY_STYLES[featured.category]}>
                    {NEWS_CATEGORIES.find((entry) => entry.id === featured.category)?.label}
                  </Badge>
                  <Badge variant="warning">Demo</Badge>
                  <span className="ml-auto flex items-center gap-1 text-3xs text-subtle">
                    <Clock3 className="h-3 w-3" />
                    {formatTimeAgo(featured.publishedAt)} · {featured.readMinutes} min read
                  </span>
                </div>
                <h2 className="mt-3 max-w-3xl text-balance text-lg font-semibold leading-snug tracking-tight text-foreground">
                  {featured.title}
                </h2>
                <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">{featured.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-2xs font-medium text-foreground">{featured.source}</span>
                  <span className="text-3xs text-subtle">· {featured.author}</span>
                  <span className="mx-1 hidden h-3 w-px bg-border sm:block" />
                  {featured.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-3xs text-muted"
                    >
                      {getAsset(ticker)?.symbol ?? ticker}
                    </span>
                  ))}
                  <span className="ml-auto inline-flex items-center gap-1 text-2xs font-medium text-brand opacity-80 transition-opacity group-hover:opacity-100">
                    Read story
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </button>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                {hasFilters ? "Filtered stories" : "Latest stories"}
              </h2>
              <p className="text-2xs text-subtle">
                {filtered.length} fictional {filtered.length === 1 ? "story" : "stories"}
                {hasFilters ? " match your filters" : " across the market narrative"}
              </p>
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setSentiment("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {stories.length === 0 ? (
            <EmptyState
              icon={Newspaper}
              title="No stories found"
              description="Nothing in the demo newsroom matches your search. Try another ticker, desk or sentiment."
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                    setSentiment("all");
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {stories.map((article) => (
                <StoryCard key={article.id} article={article} onOpen={() => setSelected(article)} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-3 xl:sticky xl:top-4">
          <section className="panel overflow-hidden" aria-label="Trending tickers">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                Trending tickers
              </h2>
              <span className="text-3xs text-subtle">Demo feed</span>
            </div>
            <div className="p-1.5">
              {tickersQuery.isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-2 px-2 py-2">
                      <div className="skeleton h-2.5 w-16" />
                      <div className="ml-auto skeleton h-2.5 w-14" />
                    </div>
                  ))
                : TRENDING_TICKERS.map((id) => {
                    const asset = getAsset(id);
                    if (!asset) return null;
                    const snapshot = tickersQuery.data?.snapshots[asset.symbol];
                    const quote = snapshot?.quote;
                    const up = (quote?.changePercent ?? 0) >= 0;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => openTicker(id)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.04]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-2xs font-semibold text-foreground">{asset.symbol}</span>
                          <span className="block truncate text-3xs text-subtle">{asset.name}</span>
                        </span>
                        {snapshot?.sparkline?.length ? (
                          <Sparkline
                            values={snapshot.sparkline}
                            width={36}
                            height={12}
                            positive={up}
                            fill={false}
                            strokeWidth={1.1}
                          />
                        ) : null}
                        <span className="w-[74px] shrink-0 text-right">
                          <span className="tnum block text-2xs font-medium text-foreground">
                            {quote ? formatPrice(quote.price, asset) : "—"}
                          </span>
                          <span className={cn("tnum block text-3xs", up ? "text-bullish" : "text-bearish")}>
                            {quote ? `${up ? "+" : ""}${quote.changePercent.toFixed(2)}%` : "—"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
            </div>
            <div className="border-t border-border px-3 py-2">
              <Link href="/markets" className="flex items-center justify-between text-3xs text-subtle hover:text-foreground">
                All market quotes
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <section className="panel p-3.5" aria-label="Story sentiment">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Story mix</h2>
              <span className="text-3xs text-subtle">By sentiment</span>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-border">
              <span
                className="h-full bg-bullish"
                style={{ width: `${(counts.bullish / DEMO_NEWS.length) * 100}%` }}
                title={`${counts.bullish} bullish stories`}
              />
              <span
                className="h-full bg-bearish"
                style={{ width: `${(counts.bearish / DEMO_NEWS.length) * 100}%` }}
                title={`${counts.bearish} bearish stories`}
              />
              <span
                className="h-full bg-border-strong"
                style={{ width: `${(counts.neutral / DEMO_NEWS.length) * 100}%` }}
                title={`${counts.neutral} neutral stories`}
              />
            </div>
            <div className="mt-3 space-y-1.5">
              {(["bullish", "bearish", "neutral"] as NewsSentiment[]).map((key) => (
                <div key={key} className="flex items-center justify-between text-2xs">
                  <span className="flex items-center gap-1.5 text-muted">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        key === "bullish" ? "bg-bullish" : key === "bearish" ? "bg-bearish" : "bg-border-strong",
                      )}
                    />
                    {SENTIMENT_LABELS[key]}
                  </span>
                  <span className="tnum text-subtle">{counts[key]} stories</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-3.5" aria-label="News topics">
            <h2 className="text-xs font-semibold text-foreground">Browse by topic</h2>
            <div className="mt-2.5 space-y-0.5">
              {NEWS_CATEGORIES.filter((entry) => entry.id !== "all").map((entry) => {
                const count = DEMO_NEWS.filter((article) => article.category === entry.id).length;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setCategory(entry.id as NewsCategory)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-2xs transition-colors",
                      category === entry.id
                        ? "bg-brand/[0.09] text-brand"
                        : "text-muted hover:bg-foreground/[0.04] hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("h-1.5 w-1.5 rounded-full", CATEGORY_STYLES[entry.id as NewsCategory])} />
                      {entry.label}
                    </span>
                    <span className="tnum text-3xs text-subtle">{count}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="rounded-xl border border-dashed border-border bg-surface-2/40 p-3.5">
            <p className="flex items-center gap-1.5 text-2xs font-medium text-foreground">
              <BookOpen className="h-3.5 w-3.5 text-subtle" />
              About this newsroom
            </p>
            <p className="mt-1.5 text-3xs leading-relaxed text-subtle">
              Fictional articles are generated for demonstration. In a production deployment, this surface would
              be connected to a licensed news provider with attribution and timestamps.
            </p>
          </div>
        </aside>
      </div>

      <ArticleDialog
        article={selected}
        onClose={() => setSelected(null)}
        onOpenTicker={openTicker}
      />
    </div>
  );
}

function StoryCard({ article, onOpen }: { article: NewsArticle; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group panel flex w-full flex-col gap-2 p-4 text-left transition-all hover:border-border-strong hover:shadow-panel sm:flex-row sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("text-3xs font-semibold uppercase tracking-[0.07em]", CATEGORY_STYLES[article.category])}>
            {NEWS_CATEGORIES.find((entry) => entry.id === article.category)?.label}
          </span>
          <span className="h-2.5 w-px bg-border" />
          <span className="text-3xs text-subtle">{article.source}</span>
          <Badge variant="warning" className="ml-1">
            Demo
          </Badge>
          <span className="ml-auto flex items-center gap-1 text-3xs text-subtle">
            <Clock3 className="h-2.5 w-2.5" />
            {formatTimeAgo(article.publishedAt)}
          </span>
        </div>
        <h3 className="mt-1.5 text-balance text-[13px] font-semibold leading-snug tracking-tight text-foreground">
          {article.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-2xs leading-relaxed text-muted">{article.summary}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {article.tickers.slice(0, 3).map((ticker) => (
            <span
              key={ticker}
              className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-3xs text-muted"
            >
              {getAsset(ticker)?.symbol ?? ticker}
            </span>
          ))}
          <span
            className={cn(
              "ml-1 flex items-center gap-0.5 text-3xs",
              article.sentiment === "bullish"
                ? "text-bullish"
                : article.sentiment === "bearish"
                  ? "text-bearish"
                  : "text-subtle",
            )}
          >
            {article.sentiment === "bullish" ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : article.sentiment === "bearish" ? (
              <TrendingDown className="h-2.5 w-2.5" />
            ) : null}
            {SENTIMENT_LABELS[article.sentiment]}
          </span>
          <span className="ml-auto flex items-center gap-1 text-3xs text-subtle">
            {article.readMinutes} min
            <ArrowRight className="h-3 w-3 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </div>
      </div>
    </button>
  );
}

function ArticleDialog({
  article,
  onClose,
  onOpenTicker,
}: {
  article: NewsArticle | null;
  onClose: () => void;
  onOpenTicker: (id: string) => void;
}) {
  return (
    <Dialog open={Boolean(article)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        {article && (
          <>
            <div className="border-b border-border p-5 pr-12">
              <DialogHeader className="pb-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="warning">Demo story</Badge>
                  <Badge variant="outline" className={CATEGORY_STYLES[article.category]}>
                    {NEWS_CATEGORIES.find((entry) => entry.id === article.category)?.label}
                  </Badge>
                  <span className="text-3xs text-subtle">
                    {formatDateTime(article.publishedAt)} · {article.readMinutes} min read
                  </span>
                </div>
                <DialogTitle className="mt-2 text-lg leading-snug">{article.title}</DialogTitle>
                <DialogDescription>
                  {article.source} · {article.author} · demonstration content
                </DialogDescription>
              </DialogHeader>
            </div>

            <ScrollArea className="max-h-[52vh]">
              <div className="space-y-3 p-5">
                <p className="text-[13px] font-medium leading-relaxed text-foreground">{article.summary}</p>
                {article.body.map((paragraph, index) => (
                  <p key={index} className="text-xs leading-[1.75] text-muted">
                    {paragraph}
                  </p>
                ))}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {article.tickers.map((ticker) => {
                    const asset = getAsset(ticker);
                    if (!asset) return null;
                    return (
                      <button
                        key={ticker}
                        type="button"
                        onClick={() => onOpenTicker(ticker)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-2xs text-muted transition-colors hover:border-brand/40 hover:text-brand"
                      >
                        {asset.symbol}
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-lg border border-warning/20 bg-warning/[0.04] px-3 py-2 text-3xs leading-relaxed text-warning">
                  This article is fictional and was written to demonstrate the newsroom interface. It is not
                  investment advice and does not describe real events.
                </div>
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="flex items-center gap-1.5 text-3xs text-subtle">
                <Info className="h-3 w-3" />
                Demo newsroom · no external provider
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
                {article.tickers[0] && (
                  <Button size="sm" onClick={() => onOpenTicker(article.tickers[0])}>
                    Open {getAsset(article.tickers[0])?.symbol ?? article.tickers[0]} chart
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type NewsCategory = "markets" | "crypto" | "stocks" | "forex" | "commodities" | "macro";

export type NewsSentiment = "bullish" | "bearish" | "neutral";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  body: string[];
  category: NewsCategory;
  sentiment: NewsSentiment;
  source: string;
  author: string;
  publishedAt: number;
  readMinutes: number;
  tickers: string[];
  featured?: boolean;
}

export const NEWS_CATEGORIES: Array<{ id: NewsCategory | "all"; label: string }> = [
  { id: "all", label: "All stories" },
  { id: "markets", label: "Markets" },
  { id: "crypto", label: "Crypto" },
  { id: "stocks", label: "Stocks" },
  { id: "forex", label: "Forex" },
  { id: "commodities", label: "Commodities" },
  { id: "macro", label: "Macro" },
];

export const SENTIMENT_LABELS: Record<NewsSentiment, string> = {
  bullish: "Bullish",
  bearish: "Bearish",
  neutral: "Neutral",
};

/**
 * Fictional demonstration newsroom. The timestamps are fixed so server and
 * client render identically. Every surface that shows these stories labels
 * them as demo content — they are not real reporting.
 */
export const DEMO_NEWS: NewsArticle[] = [
  {
    id: "news-fed-risk",
    title: "Global equities grind higher as rate-cut bets survive sticky inflation",
    summary:
      "Major benchmarks finished the session in the green after a cooler producer-price print offset cautious commentary from central-bank officials. Traders still price a shallow easing cycle into next year.",
    body: [
      "Equity benchmarks advanced for a third straight session as investors focused on the direction of producer prices rather than the level of headline inflation. Cyclicals led the move while defensives lagged, a pattern that typically signals improving risk appetite.",
      "Rate-sensitive sectors outperformed after the front end of the curve rallied. Strategists cautioned that the move is fragile: positioning is crowded, and a single hot inflation surprise could unwind the recent bid for duration.",
      "In this demonstration scenario, breadth improved across large-cap technology and industrials, though volume remained below its monthly average. Traders are watching the next round of central-bank speakers for confirmation that the easing bias is intact.",
    ],
    category: "markets",
    sentiment: "bullish",
    source: "Meridian Wire",
    author: "Demonstration Desk",
    publishedAt: Date.parse("2026-11-13T12:40:00Z"),
    readMinutes: 4,
    tickers: ["SPX", "NDX", "DJI"],
    featured: true,
  },
  {
    id: "news-btc-etf",
    title: "Bitcoin holds above $96K as ETF inflows offset profit-taking",
    summary:
      "Spot bitcoin funds absorbed another day of net creations, keeping the largest cryptocurrency pinned near its recent range high despite persistent selling from short-term holders.",
    body: [
      "Bitcoin traded in a tight band through the session, with dips below the psychological $95,000 level met by steady demand. Fund-flow data suggested allocators were using weakness to add exposure rather than chase strength.",
      "On-chain measures showed long-term holders largely inactive, while exchange balances continued a slow decline. That combination has historically reduced available supply, though derivatives funding remains a useful warning signal when it turns crowded.",
      "Ether and large-cap alternative assets followed bitcoin higher, but breadth across smaller tokens was mixed. In this demo scenario, traders described the tape as constructive but increasingly dependent on fresh inflows.",
    ],
    category: "crypto",
    sentiment: "bullish",
    source: "Chain Ledger",
    author: "Demo Crypto Team",
    publishedAt: Date.parse("2026-11-13T11:25:00Z"),
    readMinutes: 3,
    tickers: ["BTCUSD", "ETHUSD"],
  },
  {
    id: "news-nvda-ai-capex",
    title: "NVIDIA slips as traders question the durability of AI capex",
    summary:
      "Semiconductor shares softened after a survey of hyperscaler spending plans pointed to a slower pace of accelerator purchases next year. The debate is less about demand than about timing.",
    body: [
      "Chipmakers gave back part of their recent gains after a demonstration survey suggested that cloud providers may stagger deliveries into the new year. The reaction was concentrated in the most crowded names rather than across the whole sector.",
      "Analysts framed the move as a position reset rather than a change in the long-term thesis. Order books remain full, but investors are demanding more evidence that revenue from AI services can keep pace with infrastructure spending.",
      "AMD and other accelerator suppliers traded in sympathy. The key question for the next earnings cycle is whether margin expansion can continue if the mix shifts toward larger, more complex systems.",
    ],
    category: "stocks",
    sentiment: "bearish",
    source: "The Session Brief",
    author: "Demo Equities Desk",
    publishedAt: Date.parse("2026-11-13T10:05:00Z"),
    readMinutes: 4,
    tickers: ["NVDA", "AMD"],
  },
  {
    id: "news-eur-ecb",
    title: "Euro firms as ECB officials push back on early easing",
    summary:
      "The single currency gained against the dollar after several policy makers argued that services inflation is still too firm to justify a near-term cut. Rate differentials did the rest.",
    body: [
      "EUR/USD moved toward the top of its recent range as traders trimmed bets on an early European rate cut. Officials emphasised that wage growth and services prices need to cool further before policy can be relaxed.",
      "The dollar index softened alongside front-end yields, though the move was orderly. Options markets showed less demand for downside protection in the euro, a sign that sentiment has improved modestly.",
      "Sterling and the Swiss franc also advanced against the dollar. In this demonstration scenario, the next catalyst is the updated inflation print, which traders expect to shape the pace of easing into the spring.",
    ],
    category: "forex",
    sentiment: "bullish",
    source: "FX Pulse",
    author: "Demo FX Desk",
    publishedAt: Date.parse("2026-11-13T09:20:00Z"),
    readMinutes: 3,
    tickers: ["EURUSD", "USDCHF", "GBPUSD"],
  },
  {
    id: "news-gold-record",
    title: "Gold steadies near record as real yields stall",
    summary:
      "Bullion consolidated after a sharp run higher, with demand from central banks and ETF investors offsetting a pause in the dollar's decline. Silver lagged the move.",
    body: [
      "Gold held near the upper end of its range as real yields stopped rising. The metal has benefited from a combination of reserve diversification and expectations that policy rates have peaked.",
      "Physical demand remains firm, though jewellery consumption has softened at current prices. Investors are watching ETF holdings for confirmation that the rally has a broader base than futures positioning.",
      "Silver underperformed as industrial demand expectations cooled alongside global manufacturing data. The gold-silver ratio remains elevated, a sign that investors are treating the two metals very differently.",
    ],
    category: "commodities",
    sentiment: "bullish",
    source: "Commodity Note",
    author: "Demo Commodities Desk",
    publishedAt: Date.parse("2026-11-13T08:15:00Z"),
    readMinutes: 3,
    tickers: ["XAUUSD", "XAGUSD"],
  },
  {
    id: "news-oil-demand",
    title: "Oil retreats on demand worries; OPEC+ compliance in focus",
    summary:
      "Crude futures fell as traders weighed softer refining margins against tighter export flows. Compliance with production targets remains the swing factor for the balance of the quarter.",
    body: [
      "West Texas Intermediate slipped below its recent pivot as product cracks narrowed. The move suggests the market is more concerned about near-term consumption than about geopolitical risk premiums.",
      "Supply-side headlines remain supportive, but traders noted that compliance with voluntary cuts has been uneven. A credible extension of the current framework would remove some downside risk.",
      "Natural gas was more resilient, supported by cooler weather forecasts in key consuming regions. In this demonstration scenario, the market is likely to stay sensitive to inventory surprises through the shoulder season.",
    ],
    category: "commodities",
    sentiment: "bearish",
    source: "Commodity Note",
    author: "Demo Energy Desk",
    publishedAt: Date.parse("2026-11-13T07:30:00Z"),
    readMinutes: 3,
    tickers: ["WTI", "NG"],
  },
  {
    id: "news-aapl-services",
    title: "Apple services growth keeps valuation debate alive",
    summary:
      "A resilient services mix is supporting margins even as hardware replacement cycles lengthen. Investors are split on whether the premium is justified by cash returns alone.",
    body: [
      "Apple's services segment continues to grow faster than hardware, a mix shift that supports gross margin. The company has leaned on subscriptions, advertising and payments to smooth the cyclicality of device sales.",
      "Bulls point to a loyal installed base and substantial buybacks. Bears argue that regulatory pressure on app-store economics and slower upgrade cycles limit the multiple expansion case.",
      "The stock remains a core holding for many large-cap funds. In this demo scenario, the next catalyst is the holiday-quarter guidance rather than the trailing results.",
    ],
    category: "stocks",
    sentiment: "neutral",
    source: "The Session Brief",
    author: "Demo Equities Desk",
    publishedAt: Date.parse("2026-11-12T22:10:00Z"),
    readMinutes: 4,
    tickers: ["AAPL"],
  },
  {
    id: "news-solana-activity",
    title: "Solana leads altcoin bounce as on-chain activity accelerates",
    summary:
      "SOL outperformed the large-cap crypto complex after a surge in decentralized-exchange volume and renewed interest in consumer applications. Funding remained contained.",
    body: [
      "Solana extended its recent advance as on-chain metrics showed higher transaction counts and steady fee revenue. The move was accompanied by a broadening in decentralized-finance activity rather than a single token-led rally.",
      "Avalanche and Chainlink also participated, though volumes were lighter. Perpetual funding stayed positive but below levels that have historically preceded sharp liquidations.",
      "The broader market remains dependent on bitcoin's ability to hold its range. In this demonstration scenario, traders are watching whether the rotation into higher-beta names persists for more than a few sessions.",
    ],
    category: "crypto",
    sentiment: "bullish",
    source: "Chain Ledger",
    author: "Demo Crypto Team",
    publishedAt: Date.parse("2026-11-12T21:05:00Z"),
    readMinutes: 3,
    tickers: ["SOLUSD", "AVAXUSD", "LINKUSD"],
  },
  {
    id: "news-usdjpy-155",
    title: "Dollar-yen tests 155 as carry trades rebuild",
    summary:
      "USD/JPY pushed toward a closely watched level as yield differentials widened again. Officials repeated that sharp moves are being monitored closely.",
    body: [
      "The dollar advanced against the yen as US front-end yields edged higher. Carry demand returned after a period of volatility compression, though positioning remains lighter than earlier in the year.",
      "Japanese officials have repeatedly said they are watching currency moves with urgency. Traders interpret that language as a warning against disorderly depreciation rather than a commitment to a specific level.",
      "The pair's sensitivity to rate expectations makes it a useful gauge of global risk appetite. In this demo scenario, a sustained break above 155 would likely increase volatility across the FX complex.",
    ],
    category: "forex",
    sentiment: "neutral",
    source: "FX Pulse",
    author: "Demo FX Desk",
    publishedAt: Date.parse("2026-11-12T19:30:00Z"),
    readMinutes: 3,
    tickers: ["USDJPY", "EURUSD"],
  },
  {
    id: "news-hsi-stimulus",
    title: "Hang Seng outperforms as Beijing signals targeted stimulus",
    summary:
      "Hong Kong equities rallied on expectations for additional support to local governments and the property sector. The move was concentrated in financials and consumer names.",
    body: [
      "The Hang Seng Index outpaced regional peers after policy signals pointed to targeted spending rather than broad-based stimulus. Investors welcomed the focus on local-government financing and property completion.",
      "Mainland technology shares also advanced, though turnover remained below the peaks seen earlier in the year. Analysts warned that earnings revisions, not just policy headlines, are needed to sustain the rally.",
      "The Nikkei lagged as a stronger yen weighed on exporters. In this demonstration scenario, the near-term debate is whether the stimulus impulse can begin to show up in credit demand.",
    ],
    category: "markets",
    sentiment: "bullish",
    source: "Global Macro Desk",
    author: "Demo Asia Desk",
    publishedAt: Date.parse("2026-11-12T17:45:00Z"),
    readMinutes: 4,
    tickers: ["HSI", "N225"],
  },
  {
    id: "news-treasury-ppi",
    title: "Treasury yields slip after soft producer-price print",
    summary:
      "The front end of the curve rallied as wholesale prices came in below expectations. Equities took the data as a green light for a slower pace of tightening.",
    body: [
      "Treasury yields fell across the belly of the curve after producer prices suggested pipeline inflation is easing. The reaction was strongest in two- and five-year maturities, which are most sensitive to policy expectations.",
      "Rate-sensitive equities and gold both benefited. The dollar gave back some of its recent gains, though the move was contained by resilient activity data.",
      "The market's interpretation is that the central bank can afford to be patient. In this demo scenario, the risk is that services inflation proves stickier than the goods-led headline numbers imply.",
    ],
    category: "macro",
    sentiment: "neutral",
    source: "Global Macro Desk",
    author: "Demo Rates Desk",
    publishedAt: Date.parse("2026-11-12T15:20:00Z"),
    readMinutes: 3,
    tickers: ["SPX", "XAUUSD", "EURUSD"],
  },
  {
    id: "news-tsla-deliveries",
    title: "Tesla delivery estimate cut ahead of quarterly update",
    summary:
      "A demonstration broker survey lowered near-term delivery expectations, citing softer demand in Europe and a slower ramp of the refreshed compact model.",
    body: [
      "Tesla shares weakened after a survey of dealers and logistics data pointed to a lower delivery run rate. The estimate cut was modest but came at a time when the stock's valuation leaves little room for disappointment.",
      "Investors are focused on margin rather than volume, particularly as competition intensifies in the mid-price segment. Incentives have risen, and the mix of higher-priced trims remains an important swing factor.",
      "The longer-term debate concerns autonomy and energy storage. In this demo scenario, the quarterly update is likely to be judged on cash flow and the credibility of the next product timeline.",
    ],
    category: "stocks",
    sentiment: "bearish",
    source: "The Session Brief",
    author: "Demo Autos Desk",
    publishedAt: Date.parse("2026-11-12T12:05:00Z"),
    readMinutes: 3,
    tickers: ["TSLA"],
  },
  {
    id: "news-copper-supply",
    title: "Copper tightens on supply disruptions in South America",
    summary:
      "Industrial metal prices moved higher as mine outages reduced near-term concentrate availability. Chinese smelter demand remains the key offset.",
    body: [
      "Copper futures advanced after a series of operational disruptions tightened the concentrate market. Spot treatment charges fell, a sign that smelters are competing for limited feedstock.",
      "Demand signals are mixed. Grid investment and electrification remain supportive, while construction activity in several major economies is still subdued.",
      "The market is running a modest deficit in this demonstration scenario. A sustained break above recent highs would likely require both supply discipline and a clearer improvement in manufacturing orders.",
    ],
    category: "commodities",
    sentiment: "bullish",
    source: "Commodity Note",
    author: "Demo Metals Desk",
    publishedAt: Date.parse("2026-11-12T09:40:00Z"),
    readMinutes: 3,
    tickers: ["HG"],
  },
  {
    id: "news-eth-staking",
    title: "Ethereum staking yields compress as validator queue clears",
    summary:
      "The waiting list to exit Ethereum's validator set has shrunk, while new deposits increased. Staking yields moved lower as the active set expanded.",
    body: [
      "Ethereum's validator queue normalised after a period of elevated exits. The change reduces a source of technical uncertainty that had weighed on sentiment during the previous quarter.",
      "Staking yields drifted lower as more capital competed for the same issuance. That is a healthy sign for network participation, though it reduces the carry available to leveraged staking strategies.",
      "Layer-2 activity continued to grow, but fee revenue remains concentrated in a small number of applications. In this demo scenario, ether's next move likely depends more on bitcoin's range than on staking-specific flows.",
    ],
    category: "crypto",
    sentiment: "neutral",
    source: "Chain Ledger",
    author: "Demo Crypto Team",
    publishedAt: Date.parse("2026-11-11T18:20:00Z"),
    readMinutes: 3,
    tickers: ["ETHUSD", "BTCUSD"],
  },
  {
    id: "news-dax-industrials",
    title: "DAX climbs as industrials shrug off China data",
    summary:
      "German equities advanced despite mixed Chinese activity figures, helped by a weaker euro and firm demand for capital goods. Autos lagged.",
    body: [
      "The DAX outperformed other European benchmarks as industrial names rose on improving order expectations. A softer euro provided an additional tailwind for exporters.",
      "Chinese data was mixed, with infrastructure spending offsetting soft consumer demand. Investors chose to focus on the policy response rather than the headline miss.",
      "Autos lagged as pricing pressure and electrification costs remained in focus. In this demonstration scenario, the index's next leg depends on whether manufacturing momentum can broaden beyond a handful of large caps.",
    ],
    category: "markets",
    sentiment: "bullish",
    source: "Global Macro Desk",
    author: "Demo Europe Desk",
    publishedAt: Date.parse("2026-11-11T15:10:00Z"),
    readMinutes: 3,
    tickers: ["DAX", "EURUSD"],
  },
  {
    id: "news-msft-cloud",
    title: "Microsoft cloud spend stays resilient, survey shows",
    summary:
      "A demonstration survey of enterprise technology buyers found cloud budgets holding up, with AI workloads moving from pilots into production. Pricing remains the main sensitivity.",
    body: [
      "Enterprise spending intentions for cloud infrastructure remain stable, according to a fictional survey of technology buyers. Respondents flagged AI workloads as the fastest-growing category, though many are still measuring returns.",
      "Microsoft's position in productivity software and cloud infrastructure gives it multiple ways to monetise the shift. The key question is whether AI features can support incremental pricing without slowing seat growth.",
      "Budget scrutiny is highest in smaller organisations. In this demo scenario, large enterprise renewals will be the clearest signal of whether the spending cycle still has room to run.",
    ],
    category: "stocks",
    sentiment: "bullish",
    source: "The Session Brief",
    author: "Demo Tech Desk",
    publishedAt: Date.parse("2026-11-11T11:30:00Z"),
    readMinutes: 4,
    tickers: ["MSFT", "NVDA"],
  },
];

export const TRENDING_TICKERS = ["NVDA", "BTCUSD", "AAPL", "TSLA", "EURUSD", "XAUUSD", "SPX", "ETHUSD"];

export function getNewsArticle(id: string): NewsArticle | undefined {
  return DEMO_NEWS.find((article) => article.id === id);
}

import { NextResponse } from "next/server";
import { getAsset } from "@/lib/market/assets";
import { resolveQuotes, resolveSparklines } from "@/lib/market/service";
import type { Asset } from "@/lib/market/types";

export const dynamic = "force-dynamic";

function parseSymbols(value: string | null): string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((symbol) => symbol.trim()).filter(Boolean))].slice(0, 60);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = parseSymbols(searchParams.get("symbols"));
  const points = Math.min(Math.max(Number.parseInt(searchParams.get("points") ?? "36", 10) || 36, 8), 120);
  const assets = symbols.map((symbol) => getAsset(symbol)).filter((asset): asset is Asset => Boolean(asset));

  if (!assets.length) {
    return NextResponse.json({ error: "Provide at least one valid symbol" }, { status: 400 });
  }

  try {
    const [quotes, sparklines] = await Promise.all([
      resolveQuotes(assets),
      resolveSparklines(assets, points),
    ]);

    const snapshots: Record<string, { quote: unknown; sparkline: number[] }> = {};
    for (const quote of quotes) {
      snapshots[quote.symbol] = {
        quote,
        sparkline: sparklines.values[quote.symbol.replace("/", "").toUpperCase()] ?? [],
      };
    }

    return NextResponse.json(
      {
        snapshots,
        source: quotes.every((quote) => quote.source === "demo") ? "demo" : "delayed",
        sparklineSource: sparklines.source,
        timestamp: Date.now(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load snapshots" },
      { status: 502 },
    );
  }
}

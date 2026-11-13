import { NextResponse } from "next/server";
import { getAsset } from "@/lib/market/assets";
import { resolveQuotes } from "@/lib/market/service";
import type { Asset } from "@/lib/market/types";

export const dynamic = "force-dynamic";

const MAX_SYMBOLS = 60;

function parseSymbols(value: string | null): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(",")
        .map((symbol) => symbol.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_SYMBOLS);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = parseSymbols(searchParams.get("symbols"));
  const assets = symbols.map((symbol) => getAsset(symbol)).filter((asset): asset is Asset => Boolean(asset));

  if (!assets.length) {
    return NextResponse.json(
      { error: "Provide at least one valid symbol, e.g. ?symbols=BTCUSD,AAPL" },
      { status: 400 },
    );
  }

  try {
    const quotes = await resolveQuotes(assets);
    return NextResponse.json(
      { quotes, timestamp: Date.now() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load quotes" },
      { status: 502 },
    );
  }
}

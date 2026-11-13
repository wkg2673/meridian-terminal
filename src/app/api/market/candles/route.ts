import { NextResponse } from "next/server";
import { getAsset } from "@/lib/market/assets";
import { resolveCandles } from "@/lib/market/service";
import { TIMEFRAMES, type Timeframe } from "@/lib/market/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "BTCUSD";
  const timeframeParam = (searchParams.get("timeframe") ?? "1D") as Timeframe;
  const timeframe = TIMEFRAMES.some((entry) => entry.id === timeframeParam)
    ? timeframeParam
    : "1D";
  const limit = Number.parseInt(searchParams.get("limit") ?? "480", 10);
  const asset = getAsset(symbol);

  if (!asset) {
    return NextResponse.json({ error: `Unknown symbol: ${symbol}` }, { status: 404 });
  }

  try {
    const result = await resolveCandles(asset, timeframe, Number.isFinite(limit) ? limit : 480);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load candles" },
      { status: 502 },
    );
  }
}

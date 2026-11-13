import { NextResponse } from "next/server";
import { getProviderStatus, providerEnvHints } from "@/lib/market/service";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ...getProviderStatus(),
      providers: providerEnvHints(),
      timestamp: Date.now(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

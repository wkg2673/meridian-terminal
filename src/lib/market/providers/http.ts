export class MarketDataError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 502, code?: string) {
    super(message);
    this.name = "MarketDataError";
    this.status = status;
    this.code = code;
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 8000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    const text = await response.text();
    let body: unknown;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!response.ok) {
      const message =
        typeof body === "object" && body && "message" in body
          ? String((body as { message: unknown }).message)
          : `Provider returned HTTP ${response.status}`;
      throw new MarketDataError(message, response.status === 429 ? 429 : 502);
    }

    if (typeof body === "object" && body && "status" in body && (body as { status: string }).status === "error") {
      const detail = (body as { message?: string }).message ?? "Provider error";
      throw new MarketDataError(detail, 502);
    }

    return body as T;
  } catch (error) {
    if (error instanceof MarketDataError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new MarketDataError("Provider request timed out", 504);
    }
    throw new MarketDataError(error instanceof Error ? error.message : "Provider request failed");
  } finally {
    clearTimeout(timeout);
  }
}

export function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toTimestampSeconds(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const n = Number(value);
    return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
  }
  return null;
}

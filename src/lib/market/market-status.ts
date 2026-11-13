import type { Asset, MarketStatus } from "./types";

type NYParts = { weekday: string; minutes: number };

function nyParts(date: Date): NYParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(get("hour") === "24" ? "0" : get("hour"));
  const minute = Number(get("minute"));
  return { weekday: get("weekday"), minutes: hour * 60 + minute };
}

/**
 * Session status. Equities/indices follow the NYSE calendar, FX follows the
 * 24/5 global session, crypto is always open.
 */
export function getMarketStatus(asset: Asset, now = new Date()): MarketStatus {
  if (asset.class === "crypto") {
    return { state: "24-7", label: "24/7", detail: "Cryptocurrency markets trade continuously." };
  }

  if (asset.class === "forex") {
    const { weekday, minutes } = nyParts(now);
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
    const afterFridayClose = day === 5 && minutes >= 17 * 60;
    const beforeSundayOpen = day === 0 && minutes < 17 * 60;
    const closed = day === 6 || afterFridayClose || beforeSundayOpen;
    return closed
      ? { state: "closed", label: "Closed", detail: "FX reopens Sunday 5:00 PM ET." }
      : { state: "24-7", label: "Open", detail: "Global FX session is open." };
  }

  const { weekday, minutes } = nyParts(now);
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  if (!isWeekday) {
    return { state: "closed", label: "Closed", detail: "US markets reopen Monday 9:30 AM ET." };
  }
  if (minutes >= 9 * 60 + 30 && minutes < 16 * 60) {
    return { state: "open", label: "Open", detail: "US regular session closes 4:00 PM ET." };
  }
  if (minutes >= 4 * 60 && minutes < 9 * 60 + 30) {
    return { state: "pre", label: "Pre-market", detail: "Regular session opens 9:30 AM ET." };
  }
  if (minutes >= 16 * 60 && minutes < 20 * 60) {
    return { state: "post", label: "After hours", detail: "Extended session closes 8:00 PM ET." };
  }
  return { state: "closed", label: "Closed", detail: "US markets open 9:30 AM ET." };
}

export function isMarketOpen(asset: Asset, now = new Date()): boolean {
  const status = getMarketStatus(asset, now);
  return status.state === "open" || status.state === "24-7" || status.state === "pre" || status.state === "post";
}

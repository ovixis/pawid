/**
 * Anonymous usage counters and a simple rate limit.
 * Stored: day, metric, a coarse dimension (country code, host name or client app name), count.
 * Never stored: IP addresses, full user agents, tokens, pet or owner data.
 */
export interface UsageEnv {
  DB: D1Database;
}

type Waiter = { waitUntil(p: Promise<unknown>): void } | undefined;

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 80);

/** Host of the Origin or Referer, for API calls made from a web page. */
export function siteOf(req: Request): string {
  for (const h of ["origin", "referer"]) {
    const v = req.headers.get(h);
    if (v) try { return clean(new URL(v).hostname); } catch { /* ignore */ }
  }
  return "";
}

/** First word of the User-Agent (Claude-User, curl, python-httpx…); browsers become "browser". */
export function clientOf(req: Request): string {
  const ua = req.headers.get("user-agent") ?? "";
  if (/^Mozilla\//.test(ua)) return "browser";
  return clean(ua.split(/[\s/;(]/)[0] ?? "") || "unknown";
}

export function countryOf(req: Request): string {
  const c = (req as Request & { cf?: { country?: string } }).cf?.country ?? "";
  return /^[A-Z]{2}$/.test(c) ? c : "";
}

export function count(env: UsageEnv | undefined, waiter: Waiter, metric: string, dim = ""): void {
  if (!env?.DB) return;
  const day = new Date().toISOString().slice(0, 10);
  const p = env.DB.prepare(
    "INSERT INTO usage_daily (day, metric, dim, count) VALUES (?1, ?2, ?3, 1) ON CONFLICT (day, metric, dim) DO UPDATE SET count = count + 1",
  )
    .bind(day, metric.slice(0, 80), dim.slice(0, 80))
    .run()
    .catch(() => {});
  if (waiter) waiter.waitUntil(p);
}

// Per isolate, in memory: stops one script from hammering the API (and using up the
// free D1 write quota the reminders need). Assistants share provider IPs, so it is generous.
const WINDOW_MS = 60_000;
const PER_IP = 120;
const hits = new Map<string, { n: number; reset: number }>();

export function allowed(req: Request, now = Date.now()): boolean {
  const ip = req.headers.get("cf-connecting-ip") ?? "local";
  const e = hits.get(ip);
  if (!e || now >= e.reset) {
    if (hits.size > 5_000) for (const [k, v] of hits) if (now >= v.reset) hits.delete(k);
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    return true;
  }
  e.n += 1;
  return e.n <= PER_IP;
}

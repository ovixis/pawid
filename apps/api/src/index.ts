import { Hono, type Context } from "hono";
import { verifyShareToken, type VerifyResult } from "@pawid/core";
import { BY_HOSPET, COMPONENTS, PAGE, TOKENS, esc, hospetMark, icon, longDate, pawidMark, petCardHtml } from "@pawid/ui";
import { coveredCountries, rulesFor } from "@pawid/rules";
import { handleRpc } from "./mcp";
import { openapi } from "./openapi";
import { allowed, clientOf, count, countryOf, siteOf } from "./usage";
import { checkVetSeal, vetRoutes, type VetCheck, type VetEnv } from "./vets";
import { supportRoutes } from "./support";
import { factCheckRoutes } from "./factcheck";

export interface Env extends VetEnv {
  DB: D1Database;
  /** Secret for GET /v1/stats (read by the HosPet admin). Set with: wrangler secret put STATS_KEY */
  STATS_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

/** waitUntil when running in Workers; undefined in unit tests. */
type C = Context<{ Bindings: Env }>;
const waiter = (c: C): { waitUntil(p: Promise<unknown>): void } | undefined => {
  try { return c.executionCtx; } catch { return undefined; }
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id, X-Pair-Token",
  "Access-Control-Max-Age": "86400",
};

// Public endpoints: CORS for any site, and a per-IP limit.
app.use("/v1/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return c.body(null, 204, CORS);
  if (!c.req.path.startsWith("/v1/stats") && !allowed(c.req.raw)) return c.json({ error: "Too many requests, slow down." }, 429, CORS);
  await next();
  for (const [k, v] of Object.entries(CORS)) c.header(k, v);
});
app.use("/v/*", async (c, next) => {
  if (!allowed(c.req.raw)) return c.text("Too many requests. Try again in a minute.", 429);
  await next();
});

const REASONS: Record<string, string> = {
  malformed: "This QR code is not valid.",
  bad_signature: "This QR code was changed or is not genuine.",
  expired: "This QR code has expired. Ask the owner to generate a new one.",
  unsupported_version: "This QR code was made by a newer version of PawID.",
};

export { esc };

const nowSec = () => Math.floor(Date.now() / 1000);

app.get("/health", (c) => c.json({ ok: true }));

vetRoutes(app as never);
supportRoutes(app as never);
factCheckRoutes(app as never);

/** JSON verification, for hotel software and the HosPet integration. /api/verify is the first version's path. */
/** A verified code plus, when it carries a vet seal, whether the seal holds and the vet is still approved. */
async function verifyWithVet(env: Env | undefined, token: string): Promise<VerifyResult & { vet?: VetCheck }> {
  const res = await verifyShareToken(token, nowSec());
  if (!res.ok || !res.payload.vetSeal) return res;
  const p = res.payload;
  const vet = await checkVetSeal(env?.DB, p.vetSeal, { species: p.species, microchip: p.microchip, rabiesGivenOn: p.rabiesGivenOn, rabiesValidUntil: p.rabiesValidUntil, rabiesVaccine: p.rabiesVaccine });
  return { ...res, vet };
}

const verifyJson = async (c: C) => {
  const res = await verifyWithVet(c.env, c.req.query("token") ?? "");
  count(c.env, waiter(c), `api.verify.${res.ok ? "ok" : res.reason}`, siteOf(c.req.raw) || clientOf(c.req.raw));
  return c.json(res, res.ok ? 200 : 400);
};
app.get("/v1/verify", verifyJson);
app.get("/api/verify", verifyJson);

app.get("/v1/rules", (c) => {
  const country = c.req.query("country");
  if (country !== undefined && !/^[A-Za-z]{2}$/.test(country)) return c.json({ error: "country must be a two-letter ISO code, for example IT." }, 400);
  count(c.env, waiter(c), "api.rules", country ? country.toUpperCase() : "EU");
  return c.json(rulesFor(country ?? null));
});

app.get("/v1/countries", (c) => {
  count(c.env, waiter(c), "api.countries", siteOf(c.req.raw) || clientOf(c.req.raw));
  return c.json({ countries: coveredCountries() });
});

/** A venue component loaded on a page: counts which component, on which site (host name only). */
const WIDGETS = new Set(["scanner", "policy", "button", "travel"]);
app.get("/v1/w", (c) => {
  const w = c.req.query("c") ?? "";
  if (WIDGETS.has(w)) count(c.env, waiter(c), `widget.${w}`, siteOf(c.req.raw) || "unknown");
  return c.body(null, 204);
});

app.get("/v1/openapi.json", (c) => c.json(openapi(new URL(c.req.url).origin)));

app.get("/v1", (c) =>
  c.json({
    name: "PawID API",
    about: "Open source companion for the EU pet passport, by HosPet.eu. Not an official document.",
    docs: `${new URL(c.req.url).origin}/v1/openapi.json`,
    mcp: `${new URL(c.req.url).origin}/mcp`,
    source: "https://github.com/ovixis/pawid",
  }),
);

/** Usage numbers for the HosPet admin. Bearer STATS_KEY. */
app.get("/v1/stats", async (c) => {
  const key = c.env.STATS_KEY;
  const auth = c.req.header("authorization") ?? "";
  if (!key || !(await sameSecret(auth, `Bearer ${key}`))) return c.json({ error: "Not allowed." }, 401);
  const days = Math.min(400, Math.max(1, Number(c.req.query("days") ?? 90) || 90));
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const rows = await c.env.DB.prepare("SELECT day, metric, dim, count FROM usage_daily WHERE day >= ?1 ORDER BY day DESC, metric, dim LIMIT 20000").bind(since).all();
  return c.json({ since, rows: rows.results });
});

/** Constant-time comparison of two strings via their SHA-256. */
async function sameSecret(a: string, b: string): Promise<boolean> {
  const h = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}

// ─── MCP ──────────────────────────────────────────────────────────────────────
app.options("/mcp", (c) => c.body(null, 204, { ...CORS, Allow: "POST, GET, DELETE, OPTIONS" }));
app.get("/mcp", (c) => c.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "PawID MCP server. Send JSON-RPC over POST. Add this URL to your AI assistant as a connector." } }, 405, { ...CORS, Allow: "POST, OPTIONS" }));
app.delete("/mcp", (c) => c.body(null, 204, CORS));
app.post("/mcp", async (c) => {
  const headers = { ...CORS, "Cache-Control": "no-store" };
  if (!allowed(c.req.raw)) return c.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Too many requests, slow down." } }, 429, headers);
  let message: unknown;
  try { message = await c.req.json(); } catch { return c.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error: body is not valid JSON." } }, 400, headers); }
  const client = clientOf(c.req.raw);
  const [status, body] = await handleRpc(message, nowSec(), (what) => count(c.env, waiter(c), `mcp.${what}`, client), c.env.DB);
  if (body === null) return c.body(null, 202, CORS);
  return c.json(body, status as 200, headers);
});

const STYLE = `${TOKENS}${COMPONENTS}${PAGE}
main { max-width: 48rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
.top p { margin: 0; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.ok { display: flex; align-items: center; gap: .5rem; font-weight: 700; color: var(--pw-ink); }
.ok .pw-icon { color: var(--pw-ok); }
.fail { max-width: 32rem; margin: 3rem auto; text-align: center; padding: 2rem 1.5rem; }
.fail .pw-ring { margin: 0 auto 1rem; }
.fail h1 { margin: 0 0 .5rem; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.fail p { margin: 0; color: var(--pw-ink-muted); }
.by { margin-top: 1.5rem; justify-content: center; width: 100%; font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); }
.by a { color: inherit; }
@media print { .top, .by { display: none; } main { padding: 0; } }`;

/** "Code valid for 14 more minutes" or "Code valid until 28 November 2026". */
function expiresIn(exp: number): string {
  const min = Math.max(1, Math.round((exp - nowSec()) / 60));
  if (min < 120) return `Code valid for ${min} more ${min === 1 ? "minute" : "minutes"}`;
  return `Code valid until ${longDate(new Date(exp * 1000).toISOString().slice(0, 10))}`;
}

function page(res: VerifyResult & { vet?: VetCheck }, todayIso: string): string {
  const body = res.ok
    ? `<div class="top"><p class="ok">${icon("checkCircleFill")} Not changed since the owner made this code</p><p>${esc(expiresIn(res.payload.exp))}</p></div>
${petCardHtml(res.payload, { todayIso, headingLevel: 1, hideEmpty: true, vet: res.vet })}`
    : `<section class="pw-card fail"><span class="pw-ring pw-ring-navy">${icon("warning")}</span><h1>Cannot verify</h1><p>${esc(REASONS[res.reason] ?? "Invalid.")}</p></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${res.ok ? `${esc(res.payload.name)}, PawID pet card` : "PawID: cannot verify"}</title>
<style>${STYLE}</style></head><body><main>${body}
<p class="by pw-by">${pawidMark()}<span>PawID by</span><a href="${BY_HOSPET.href}" rel="noopener">${hospetMark()}HosPet.eu</a><span>Open source. Not an official document.</span></p></main></body></html>`;
}

/** Page the hotel sees after scanning the QR. No account, no app. */
app.get("/v/:token", async (c) => {
  const res = await verifyWithVet(c.env, c.req.param("token"));
  count(c.env, waiter(c), `verify.page.${res.ok ? "ok" : res.reason}`, countryOf(c.req.raw));
  return c.html(page(res, new Date().toISOString().slice(0, 10)), res.ok ? 200 : 400, {
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });
});

export default {
  fetch: app.fetch,

  /** Daily cron. Reminders are made on the phone (calendar file), so the server only cleans old counters. */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    // Usage counters are kept for about 13 months.
    const cutoff = new Date(Date.now() - 400 * 86_400_000).toISOString().slice(0, 10);
    await env.DB.prepare("DELETE FROM usage_daily WHERE day < ?1").bind(cutoff).run();
    // Vet pairings that ran out.
    await env.DB.prepare("DELETE FROM pairs WHERE expires < ?1").bind(nowSec()).run();
  },
};

export { app };

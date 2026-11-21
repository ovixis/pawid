// Fact checks on the travel rules: anyone confirms a rule or suggests a correction, always with a
// source. HosPet.eu reviews each one before it shows. A rule's text and status change only in the rule
// files on GitHub, never from this table: an accepted correction is a task for a maintainer.
import type { Context, Hono } from "hono";
import { z } from "zod";
import { COUNTRIES, EU_BASE, isOfficialSource } from "@pawid/rules";
import { humanCheck, type TurnstileEnv } from "./turnstile";
import { isAdmin } from "./support";

interface FactEnv extends TurnstileEnv { DB: D1Database; STATS_KEY?: string }
type C = Context<{ Bindings: FactEnv }>;

/** Every rule a fact check can be about: EU.<id> and <country>.<id>. */
export const RULE_KEYS = new Set([
  ...EU_BASE.rules.map((r) => `EU.${r.id}`),
  ...COUNTRIES.flatMap((c) => c.overrides.map((r) => `${c.country}.${r.id}`)),
]);

export const FACT_ROLES = ["owner", "vet", "venue", "factchecker", "authority", "other"] as const;
const text = (max: number) => z.string().trim().max(max);
const bodySchema = z.object({
  rule: z.string().max(80).refine((k) => RULE_KEYS.has(k)),
  verdict: z.enum(["confirm", "correct", "outdated"]),
  source: z.string().trim().max(600).url().refine((u) => u.startsWith("https://")),
  quote: text(600).optional(),
  suggestion: text(1000).optional(),
  name: text(100).optional(),
  role: z.enum(FACT_ROLES),
  organization: text(120).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  public: z.boolean(),
  website: z.string().max(0).optional(), // honeypot
  turnstile: z.string().max(4096).optional(),
}).refine((b) => b.verdict === "confirm" || (b.suggestion ?? "").length >= 10, { path: ["suggestion"] });

// At most 10 checks per address per hour (per Worker instance; the address is not stored).
const recent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  list.push(now);
  recent.set(ip, list);
  return list.length > 10;
}

interface Row { rule_key: string; verdict: string; source_url: string; source_official: number; quote: string | null; suggestion: string | null; name: string | null; role: string; organization: string | null; public: number; org_verified: number; day: string; reviewed: string | null }

export function factCheckRoutes(app: Hono<{ Bindings: FactEnv }>): void {
  app.post("/v1/factchecks", async (c) => {
    if (tooMany(c.req.header("cf-connecting-ip") ?? "local")) return c.json({ error: "Thank you, you sent many checks already. Try again in an hour." }, 429);
    const b = bodySchema.safeParse(await c.req.json().catch(() => null));
    if (!b.success) {
      const f = b.error.issues[0]?.path[0];
      return c.json({ error: f === "source" ? "Add the address (https://…) of the page that says it." : f === "suggestion" ? "Write how the rule should read." : "Check the form and try again." }, 400);
    }
    if (b.data.website) return c.json({ ok: true }, 201);
    if (!(await humanCheck(c.env, b.data.turnstile, c.req.header("cf-connecting-ip")))) return c.json({ error: "The check that you are a person did not pass. Try again." }, 403);
    const d = b.data;
    await c.env.DB.prepare(`INSERT INTO fact_checks (id, rule_key, verdict, source_url, source_official, quote, suggestion, name, role, organization, email, public, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`)
      .bind(crypto.randomUUID(), d.rule, d.verdict, d.source, isOfficialSource(d.source) ? 1 : 0, d.quote || null, d.verdict === "confirm" ? null : d.suggestion || null,
        d.name || null, d.role, d.organization || null, d.email || null, d.public ? 1 : 0, new Date().toISOString())
      .run();
    return c.json({ ok: true }, 201);
  });

  /** Public: accepted checks per rule (names only when the person chose so), and how many wait for review. */
  app.get("/v1/factchecks", async (c) => {
    const prefix = (c.req.query("scope") ?? "").toUpperCase();
    const like = /^(EU|[A-Z]{2})$/.test(prefix) ? `${prefix}.%` : "%";
    const [acc, pend] = await Promise.all([
      c.env.DB.prepare(`SELECT rule_key, verdict, source_url, source_official, quote, suggestion, name, role, organization, public, org_verified,
          substr(created_at, 1, 10) AS day, substr(reviewed_at, 1, 10) AS reviewed
        FROM fact_checks WHERE status = 'accepted' AND (rule_key LIKE ?1 OR rule_key LIKE 'EU.%') ORDER BY reviewed_at DESC LIMIT 500`).bind(like).all<Row>(),
      c.env.DB.prepare("SELECT rule_key, COUNT(*) AS n FROM fact_checks WHERE status = 'pending' GROUP BY rule_key").all<{ rule_key: string; n: number }>(),
    ]);
    const checks: Record<string, unknown[]> = {};
    for (const r of acc.results) {
      (checks[r.rule_key] ??= []).push({
        verdict: r.verdict, source: r.source_url, official: Boolean(r.source_official), quote: r.quote, suggestion: r.suggestion,
        by: r.public ? { name: r.name, organization: r.organization } : null, role: r.role, factChecker: Boolean(r.org_verified), day: r.day, reviewed: r.reviewed,
      });
    }
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ checks, pending: Object.fromEntries(pend.results.map((r) => [r.rule_key, r.n])) });
  });

  app.get("/v1/admin/factchecks", async (c) => {
    if (!(await isAdmin(c as never))) return c.json({ error: "Not allowed." }, 401);
    const rows = await c.env.DB.prepare("SELECT * FROM fact_checks ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 2000").all();
    return c.json({ factChecks: rows.results });
  });
  /** accept | reject | verify-org (a fact-checking organisation HosPet.eu has checked) | unverify-org. */
  app.post("/v1/admin/factchecks/:id/:action", async (c) => {
    if (!(await isAdmin(c as never))) return c.json({ error: "Not allowed." }, 401);
    const note = ((await c.req.json().catch(() => ({}))) as { note?: string }).note?.slice(0, 500) ?? null;
    const id = c.req.param("id");
    const now = new Date().toISOString();
    const q = ({
      accept: c.env.DB.prepare("UPDATE fact_checks SET status = 'accepted', reviewed_at = ?2, review_note = ?3 WHERE id = ?1").bind(id, now, note),
      reject: c.env.DB.prepare("UPDATE fact_checks SET status = 'rejected', reviewed_at = ?2, review_note = ?3 WHERE id = ?1").bind(id, now, note),
      "verify-org": c.env.DB.prepare("UPDATE fact_checks SET org_verified = 1 WHERE id = ?1").bind(id),
      "unverify-org": c.env.DB.prepare("UPDATE fact_checks SET org_verified = 0 WHERE id = ?1").bind(id),
    } as Record<string, D1PreparedStatement>)[c.req.param("action")];
    if (!q) return c.json({ error: "Unknown action." }, 400);
    const r = await q.run();
    return r.meta.changes ? c.json({ ok: true }) : c.json({ error: "Not found." }, 404);
  });
}

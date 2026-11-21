// "Support PawID": people and organisations leave a statement of support. HosPet.eu approves each one
// before it counts or shows, then brings the numbers to grant applications and EU consultations.
import type { Context, Hono } from "hono";
import { z } from "zod";

interface SupportEnv { DB: D1Database; STATS_KEY?: string }
type C = Context<{ Bindings: SupportEnv }>;

export const ROLES = ["owner", "vet", "venue", "association", "developer", "other"] as const;
const text = (max: number) => z.string().trim().max(max);
const bodySchema = z.object({
  name: text(100).min(2),
  role: z.enum(ROLES),
  country: z.string().regex(/^[A-Z]{2}$/),
  organization: text(120).optional(),
  message: text(280).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  public: z.boolean(),
  website: z.string().max(0).optional(), // honeypot: people leave it empty
});

async function sameSecret(a: string, b: string): Promise<boolean> {
  const h = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}
const isAdmin = async (c: C) => Boolean(c.env.STATS_KEY) && (await sameSecret(c.req.header("authorization") ?? "", `Bearer ${c.env.STATS_KEY}`));

// At most 5 statements per address per hour (per Worker instance; the address is not stored).
const recent = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (recent.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  list.push(now);
  recent.set(ip, list);
  return list.length > 5;
}

export function supportRoutes(app: Hono<{ Bindings: SupportEnv }>): void {
  app.post("/v1/support", async (c) => {
    if (tooMany(c.req.header("cf-connecting-ip") ?? "local")) return c.json({ error: "Thank you, we already have your statement." }, 429);
    const b = bodySchema.safeParse(await c.req.json().catch(() => null));
    if (!b.success) return c.json({ error: "Check your name, role and country." }, 400);
    if (b.data.website) return c.json({ ok: true }, 201); // a bot: accept silently, keep nothing
    const d = b.data;
    const id = crypto.randomUUID();
    await c.env.DB.prepare("INSERT INTO supporters (id, name, role, country, organization, message, email, public, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)")
      .bind(id, d.name, d.role, d.country, d.organization || null, d.message || null, d.email || null, d.public ? 1 : 0, new Date().toISOString())
      .run();
    return c.json({ ok: true }, 201);
  });

  /** Public numbers and the approved statements people chose to make public. */
  app.get("/v1/support", async (c) => {
    const [total, roles, countries, list] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) AS n FROM supporters WHERE status = 'approved'").first<{ n: number }>(),
      c.env.DB.prepare("SELECT role, COUNT(*) AS n FROM supporters WHERE status = 'approved' GROUP BY role").all<{ role: string; n: number }>(),
      c.env.DB.prepare("SELECT COUNT(DISTINCT country) AS n FROM supporters WHERE status = 'approved'").first<{ n: number }>(),
      c.env.DB.prepare("SELECT name, role, country, organization, message, substr(created_at, 1, 10) AS day FROM supporters WHERE status = 'approved' AND public = 1 ORDER BY created_at DESC LIMIT 60").all(),
    ]);
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ total: total?.n ?? 0, countries: countries?.n ?? 0, roles: Object.fromEntries(roles.results.map((r) => [r.role, r.n])), statements: list.results });
  });

  app.get("/v1/admin/support", async (c) => {
    if (!(await isAdmin(c))) return c.json({ error: "Not allowed." }, 401);
    const rows = await c.env.DB.prepare("SELECT * FROM supporters ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 2000").all();
    return c.json({ supporters: rows.results });
  });
  app.post("/v1/admin/support/:id/:action", async (c) => {
    if (!(await isAdmin(c))) return c.json({ error: "Not allowed." }, 401);
    const to = ({ approve: "approved", reject: "rejected" } as Record<string, string>)[c.req.param("action")];
    if (!to) return c.json({ error: "Unknown action." }, 400);
    const r = await c.env.DB.prepare("UPDATE supporters SET status = ?1 WHERE id = ?2").bind(to, c.req.param("id")).run();
    return r.meta.changes ? c.json({ status: to }) : c.json({ error: "Not found." }, 404);
  });
}

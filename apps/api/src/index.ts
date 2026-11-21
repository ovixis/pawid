import { Hono } from "hono";
import { verifyShareToken, type VerifyResult } from "@pawid/core";

export interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

const REASONS: Record<string, string> = {
  malformed: "This QR code is not valid.",
  bad_signature: "This QR code was changed or is not genuine.",
  expired: "This QR code has expired. Ask the owner to generate a new one.",
  unsupported_version: "This QR code was made by a newer version of PawID.",
};

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

const nowSec = () => Math.floor(Date.now() / 1000);

app.get("/health", (c) => c.json({ ok: true }));

/** JSON verification, for hotel software and the HosPet integration. */
app.get("/api/verify", async (c) => {
  const token = c.req.query("token") ?? "";
  const res = await verifyShareToken(token, nowSec());
  return c.json(res, res.ok ? 200 : 400);
});

function page(res: VerifyResult): string {
  const body = res.ok
    ? `<h1>Dog details</h1>
       <p><strong>Name:</strong> ${esc(res.payload.name)}</p>
       <p><strong>Microchip:</strong> ${esc(res.payload.microchip)}</p>
       <p><strong>Rabies valid until:</strong> ${esc(res.payload.rabiesValidUntil ?? "not provided")}</p>
       <p class="warn">Declared by the owner. Not verified by a vet. Not an official document.
       Check the paper EU pet passport if you need proof.</p>`
    : `<h1>Cannot verify</h1><p>${esc(REASONS[res.reason] ?? "Invalid.")}</p>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>PawID</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:2rem auto;padding:0 1rem}
.warn{background:#fff4d6;padding:.75rem;border-radius:.5rem}</style></head><body>${body}</body></html>`;
}

/** Page the hotel sees after scanning the QR. No account, no app. */
app.get("/v/:token", async (c) => {
  const res = await verifyShareToken(c.req.param("token"), nowSec());
  return c.html(page(res), res.ok ? 200 : 400, {
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    "Referrer-Policy": "no-referrer",
    "Cache-Control": "no-store",
  });
});

export default {
  fetch: app.fetch,

  /** Daily cron. Picks due reminders. Sending the email is not wired yet. */
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    const due = await env.DB.prepare(
      "SELECT id, email, dog_name, kind, valid_until FROM reminders WHERE send_on <= ?1 AND sent_at IS NULL LIMIT 100",
    )
      .bind(today)
      .all();
    // TODO: send the email with the provider you choose, then mark sent_at.
    console.log(`reminders due: ${due.results.length}`);
  },
};

export { app };

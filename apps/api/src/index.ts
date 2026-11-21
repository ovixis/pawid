import { Hono } from "hono";
import { verifyShareToken, type VerifyResult } from "@pawid/core";
import { BY_HOSPET, COMPONENTS, PAGE, TOKENS, esc, icon, longDate, petCardHtml } from "@pawid/ui";

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

export { esc };

const nowSec = () => Math.floor(Date.now() / 1000);

app.get("/health", (c) => c.json({ ok: true }));

/** JSON verification, for hotel software and the HosPet integration. */
app.get("/api/verify", async (c) => {
  const token = c.req.query("token") ?? "";
  const res = await verifyShareToken(token, nowSec());
  return c.json(res, res.ok ? 200 : 400);
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
.by { margin-top: 1.5rem; text-align: center; font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); }
.by a { color: inherit; }
@media print { .top, .by { display: none; } main { padding: 0; } }`;

/** "Code valid for 14 more minutes" or "Code valid until 28 November 2026". */
function expiresIn(exp: number): string {
  const min = Math.max(1, Math.round((exp - nowSec()) / 60));
  if (min < 120) return `Code valid for ${min} more ${min === 1 ? "minute" : "minutes"}`;
  return `Code valid until ${longDate(new Date(exp * 1000).toISOString().slice(0, 10))}`;
}

function page(res: VerifyResult, todayIso: string): string {
  const body = res.ok
    ? `<div class="top"><p class="ok">${icon("checkCircleFill")} Not changed since the owner made this code</p><p>${esc(expiresIn(res.payload.exp))}</p></div>
${petCardHtml(res.payload, { todayIso, headingLevel: 1, hideEmpty: true })}`
    : `<section class="pw-card fail"><span class="pw-ring pw-ring-navy">${icon("warning")}</span><h1>Cannot verify</h1><p>${esc(REASONS[res.reason] ?? "Invalid.")}</p></section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${res.ok ? `${esc(res.payload.name)}, PawID pet card` : "PawID: cannot verify"}</title>
<style>${STYLE}</style></head><body><main>${body}
<p class="by"><a href="${BY_HOSPET.href}" rel="noopener">${BY_HOSPET.text}</a>, open source</p></main></body></html>`;
}

/** Page the hotel sees after scanning the QR. No account, no app. */
app.get("/v/:token", async (c) => {
  const res = await verifyShareToken(c.req.param("token"), nowSec());
  return c.html(page(res, new Date().toISOString().slice(0, 10)), res.ok ? 200 : 400, {
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

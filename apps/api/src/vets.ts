// Vets: registration with a passkey, approval by HosPet.eu, confirmation of a pet's microchip and
// rabies vaccination, and the encrypted hand-over of the confirmation to the owner's phone.
import type { Context, Hono } from "hono";
import {
  PASSKEY_ALGS, VET_CONFIRM_KEYS, b64urlDecode, b64urlEncode, confirmChallenge, verifyPasskeyAssertion, verifyVetSeal,
  vetConfirmMessage, vetFieldsSchema, vetSealSchema, type VetFields, type VetSeal,
} from "@pawid/core";
import { z } from "zod";

export interface VetEnv {
  DB: D1Database;
  STATS_KEY?: string;
  /** PKCS#8 Ed25519 private key (base64url) for the "s1" confirmation key. wrangler secret put VET_SIGNING_KEY */
  VET_SIGNING_KEY?: string;
  /** Passkey relying party, e.g. pawid.hospet.eu */
  VET_RP_ID?: string;
  /** Allowed page origins, comma separated, e.g. https://pawid.hospet.eu */
  VET_ORIGINS?: string;
}
type C = Context<{ Bindings: VetEnv }>;

const SIGNING_KID = "s1";
const nowSec = () => Math.floor(Date.now() / 1000);
const rp = (env: VetEnv) => ({ rpId: env.VET_RP_ID ?? "pawid.hospet.eu", origins: (env.VET_ORIGINS ?? "https://pawid.hospet.eu").split(",").map((s) => s.trim()) });
const newId = (bytes = 9) => b64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)));

const assertionSchema = z.object({
  authenticatorData: z.string().max(2000),
  clientDataJSON: z.string().max(4000),
  signature: z.string().max(1500),
});
const text = (max: number) => z.string().trim().min(1).max(max);
const registerSchema = z.object({
  name: text(120),
  country: z.string().regex(/^[A-Z]{2}$/),
  registerBody: text(160),
  registerNumber: text(40),
  clinic: z.string().trim().max(160).optional(),
  email: z.string().trim().email().max(200),
  credentialId: z.string().regex(/^[A-Za-z0-9_-]{16,700}$/),
  publicKey: z.string().regex(/^[A-Za-z0-9_-]{40,1200}$/),
  alg: z.number().int().refine((a) => PASSKEY_ALGS.includes(a)),
});

interface VetRow {
  id: string; name: string; country: string; register_body: string; register_number: string; clinic: string | null;
  email: string; credential_id: string; public_key: string; alg: number; status: string; created_at: string; decided_at: string | null; confirmations: number;
}
const publicVet = (v: VetRow) => ({ id: v.id, name: v.name, country: v.country, registerBody: v.register_body, registerNumber: v.register_number, clinic: v.clinic ?? undefined, status: v.status });

async function sameSecret(a: string, b: string): Promise<boolean> {
  const h = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([h(a), h(b)]);
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x[i]! ^ y[i]!;
  return d === 0;
}
const isAdmin = async (c: C) => Boolean(c.env.STATS_KEY) && (await sameSecret(c.req.header("authorization") ?? "", `Bearer ${c.env.STATS_KEY}`));

async function signSeal(env: VetEnv, vetId: string, at: number, f: VetFields): Promise<VetSeal> {
  if (!env.VET_SIGNING_KEY) throw new Error("VET_SIGNING_KEY missing");
  const key = await crypto.subtle.importKey("pkcs8", b64urlDecode(env.VET_SIGNING_KEY) as BufferSource, { name: "Ed25519" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, key, vetConfirmMessage(vetId, at, f) as BufferSource));
  return { v: vetId, t: at, k: SIGNING_KID, s: b64urlEncode(sig) };
}

export interface VetCheck {
  status: "confirmed" | "revoked" | "invalid";
  name?: string; registerBody?: string; registerNumber?: string; country?: string;
  /** YYYY-MM-DD */
  on?: string;
}

/** For the verify page and API: does the vet seal in a code hold, and is the vet still approved? */
export async function checkVetSeal(db: D1Database | undefined, seal: unknown, fields: Partial<VetFields>): Promise<VetCheck | undefined> {
  if (!seal) return undefined;
  const s = vetSealSchema.safeParse(seal);
  const f = vetFieldsSchema.safeParse({ ...fields, species: fields.species ?? "dog" });
  if (!s.success || !f.success || !(await verifyVetSeal(s.data, f.data))) return { status: "invalid" };
  const vet = db ? await db.prepare("SELECT * FROM vets WHERE id = ?1").bind(s.data.v).first<VetRow>() : null;
  if (!vet) return { status: "invalid" };
  const base = { name: vet.name, registerBody: vet.register_body, registerNumber: vet.register_number, country: vet.country, on: new Date(s.data.t * 1000).toISOString().slice(0, 10) };
  return vet.status === "approved" ? { status: "confirmed", ...base } : { status: "revoked", ...base };
}

export function vetRoutes(app: Hono<{ Bindings: VetEnv }>): void {
  /** PawID's public confirmation keys, for anyone who wants to check a seal. */
  app.get("/v1/keys", (c) => c.json({ vetConfirm: Object.entries(VET_CONFIRM_KEYS).map(([kid, x]) => ({ kid, alg: "Ed25519", x })) }));

  /** A vet registers: their details and the passkey's public key. Starts as pending. */
  app.post("/v1/vets", async (c) => {
    const body = registerSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Check the form: every field except the clinic is needed." }, 400);
    const b = body.data;
    const existing = await c.env.DB.prepare("SELECT id FROM vets WHERE credential_id = ?1").bind(b.credentialId).first<{ id: string }>();
    if (existing) return c.json({ error: "This passkey is already registered. Sign in instead." }, 409);
    const id = newId();
    await c.env.DB.prepare("INSERT INTO vets (id, name, country, register_body, register_number, clinic, email, credential_id, public_key, alg, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)")
      .bind(id, b.name, b.country, b.registerBody, b.registerNumber, b.clinic ?? null, b.email, b.credentialId, b.publicKey, b.alg, new Date().toISOString())
      .run();
    return c.json({ id, status: "pending" }, 201);
  });

  /** Sign in on a phone: the passkey signs "pawid-signin:<time>". Returns who the vet is and their status. */
  app.post("/v1/vets/signin", async (c) => {
    const body = z.object({ credentialId: z.string().max(700), at: z.number().int(), assertion: assertionSchema }).safeParse(await c.req.json().catch(() => null));
    if (!body.success || Math.abs(body.data.at - nowSec()) > 300) return c.json({ error: "Sign in again." }, 400);
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE credential_id = ?1").bind(body.data.credentialId).first<VetRow>();
    if (!vet) return c.json({ error: "This passkey is not registered with PawID." }, 404);
    const challenge = await confirmChallenge(new TextEncoder().encode(`pawid-signin:${body.data.at}`));
    if (!(await verifyPasskeyAssertion({ publicKey: vet.public_key, alg: vet.alg, assertion: body.data.assertion, challenge, ...rp(c.env) }))) return c.json({ error: "The passkey check failed." }, 401);
    return c.json(publicVet(vet));
  });

  /** Public record of an approved (or revoked) vet. */
  app.get("/v1/vets/:id", async (c) => {
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE id = ?1 AND status IN ('approved', 'revoked')").bind(c.req.param("id")).first<VetRow>();
    return vet ? c.json(publicVet(vet)) : c.json({ error: "Not found." }, 404);
  });

  /** The vet confirms. The passkey signed SHA-256 of the exact confirmation message; PawID seals it. */
  app.post("/v1/vets/confirm", async (c) => {
    const body = z.object({ vetId: z.string().max(24), at: z.number().int(), fields: vetFieldsSchema, assertion: assertionSchema }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Check the microchip (15 digits) and the vaccine dates." }, 400);
    const { vetId, at, fields, assertion } = body.data;
    if (Math.abs(at - nowSec()) > 600) return c.json({ error: "Too slow. Confirm again." }, 400);
    if (fields.rabiesValidUntil < fields.rabiesGivenOn) return c.json({ error: "The vaccine can't expire before it was given." }, 400);
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE id = ?1").bind(vetId).first<VetRow>();
    if (!vet) return c.json({ error: "Unknown vet." }, 404);
    if (vet.status !== "approved") return c.json({ error: vet.status === "pending" ? "Your registration is not approved yet." : "This vet account cannot confirm." }, 403);
    const challenge = await confirmChallenge(vetConfirmMessage(vetId, at, fields));
    if (!(await verifyPasskeyAssertion({ publicKey: vet.public_key, alg: vet.alg, assertion, challenge, ...rp(c.env) }))) return c.json({ error: "The passkey check failed." }, 401);
    const seal = await signSeal(c.env, vetId, at, fields);
    await c.env.DB.prepare("UPDATE vets SET confirmations = confirmations + 1 WHERE id = ?1").bind(vetId).run();
    return c.json({ seal, fields, vet: { name: vet.name, registerBody: vet.register_body, registerNumber: vet.register_number, country: vet.country } });
  });

  // Hand-over: encrypted on the vet's phone, read once by the owner's phone.
  const relayId = z.string().regex(/^[A-Za-z0-9_-]{22,43}$/);
  app.put("/v1/relay/:id", async (c) => {
    const id = relayId.safeParse(c.req.param("id"));
    const body = z.object({ data: z.string().max(8000) }).safeParse(await c.req.json().catch(() => null));
    if (!id.success || !body.success) return c.json({ error: "Bad request." }, 400);
    await c.env.DB.prepare("INSERT OR REPLACE INTO vet_relay (id, data, expires) VALUES (?1, ?2, ?3)").bind(id.data, body.data.data, nowSec() + 3600).run();
    return c.body(null, 204);
  });
  app.get("/v1/relay/:id", async (c) => {
    const id = relayId.safeParse(c.req.param("id"));
    if (!id.success) return c.json({ error: "Bad request." }, 400);
    const row = await c.env.DB.prepare("SELECT data, expires FROM vet_relay WHERE id = ?1").bind(id.data).first<{ data: string; expires: number }>();
    if (!row || row.expires < nowSec()) return c.json({ waiting: true }, 404);
    await c.env.DB.prepare("DELETE FROM vet_relay WHERE id = ?1").bind(id.data).run();
    c.header("Cache-Control", "no-store");
    return c.json({ data: row.data });
  });

  // Admin (HosPet.eu): list, approve, revoke, reject. Bearer STATS_KEY.
  app.get("/v1/admin/vets", async (c) => {
    if (!(await isAdmin(c))) return c.json({ error: "Not allowed." }, 401);
    const rows = await c.env.DB.prepare("SELECT id, name, country, register_body, register_number, clinic, email, status, created_at, decided_at, confirmations FROM vets ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 500").all();
    return c.json({ vets: rows.results });
  });
  app.post("/v1/admin/vets/:id/:action", async (c) => {
    if (!(await isAdmin(c))) return c.json({ error: "Not allowed." }, 401);
    const to = ({ approve: "approved", revoke: "revoked", reject: "rejected" } as Record<string, string>)[c.req.param("action")];
    if (!to) return c.json({ error: "Unknown action." }, 400);
    const r = await c.env.DB.prepare("UPDATE vets SET status = ?1, decided_at = ?2 WHERE id = ?3").bind(to, new Date().toISOString(), c.req.param("id")).run();
    return r.meta.changes ? c.json({ id: c.req.param("id"), status: to }) : c.json({ error: "Not found." }, 404);
  });
}

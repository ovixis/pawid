// Vets: registration with a passkey, approval by HosPet.eu, confirmation of a pet's microchip and
// rabies vaccination, and the encrypted hand-over of the confirmation to the owner's phone.
import type { Context, Hono } from "hono";
import {
  CONFIRM_ISSUERS, PASSKEY_ALGS, VET_CONFIRM_KEYS, b64urlDecode, b64urlEncode, confirmChallenge, pairClaimMessage, verifyPasskeyAssertion, verifyVetSeal,
  petCredential, signCredential, vetConfirmMessage, vetConfirmationSchema, vetFieldsSchema, vetSealSchema, type VetFields, type VetSeal,
} from "@pawid/core";
import { z } from "zod";
import { humanCheck, type TurnstileEnv } from "./turnstile";

export interface VetEnv extends TurnstileEnv {
  DB: D1Database;
  STATS_KEY?: string;
  /** PKCS#8 Ed25519 private key (base64url) for the "s1" confirmation key. wrangler secret put VET_SIGNING_KEY */
  VET_SIGNING_KEY?: string;
  /** Key id of VET_SIGNING_KEY in CONFIRM_ISSUERS (default s1). */
  VET_SIGNING_KID?: string;
  /** Issuer of the W3C credentials (default: this key's did in CONFIRM_ISSUERS). */
  CREDENTIAL_ISSUER?: string;
  /** Passkey relying party, e.g. pawid.hospet.eu */
  VET_RP_ID?: string;
  /** Allowed page origins, comma separated, e.g. https://pawid.hospet.eu */
  VET_ORIGINS?: string;
}
type C = Context<{ Bindings: VetEnv }>;

const DEFAULT_KID = "s1";
/** This copy's confirmation key id (VET_SIGNING_KID, default s1). */
const kidOf = (env: VetEnv) => env.VET_SIGNING_KID ?? DEFAULT_KID;
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
  turnstile: z.string().max(4096).optional(),
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
  return { v: vetId, t: at, k: kidOf(env), s: b64urlEncode(sig) };
}

export interface VetCheck {
  status: "confirmed" | "revoked" | "invalid";
  name?: string; registerBody?: string; registerNumber?: string; country?: string;
  /** YYYY-MM-DD */
  on?: string;
}

/** A vet approved by another recognised PawID copy: ask that copy (cached for an hour). */
async function remoteVet(kid: string, vetId: string, ownKid: string): Promise<VetRow | null> {
  const issuer = CONFIRM_ISSUERS[kid];
  if (!issuer || kid === ownKid || !/^[A-Za-z0-9_-]{6,24}$/.test(vetId)) return null;
  try {
    const r = await fetch(`${issuer.api}/v1/vets/${vetId}`, { signal: AbortSignal.timeout(4000), cf: { cacheTtl: 3600, cacheEverything: true } } as RequestInit);
    if (!r.ok) return null;
    const v = (await r.json()) as { name?: string; country?: string; registerBody?: string; registerNumber?: string; status?: string };
    if (!v.name || (v.status !== "approved" && v.status !== "revoked")) return null;
    return { id: vetId, name: v.name, country: v.country ?? "", register_body: v.registerBody ?? "", register_number: v.registerNumber ?? "", status: v.status } as VetRow;
  } catch {
    return null;
  }
}

/** For the verify page and API: does the vet seal in a code hold, and is the vet still approved? */
export async function checkVetSeal(db: D1Database | undefined, seal: unknown, fields: Partial<VetFields>, ownKid = DEFAULT_KID): Promise<VetCheck | undefined> {
  if (!seal) return undefined;
  const s = vetSealSchema.safeParse(seal);
  const f = vetFieldsSchema.safeParse({ ...fields, species: fields.species ?? "dog" });
  if (!s.success || !f.success || !(await verifyVetSeal(s.data, f.data))) return { status: "invalid" };
  const local = s.data.k === ownKid && db ? await db.prepare("SELECT * FROM vets WHERE id = ?1").bind(s.data.v).first<VetRow>() : null;
  const vet = local ?? (await remoteVet(s.data.k, s.data.v, ownKid));
  if (!vet) return { status: "invalid" };
  const base = { name: vet.name, registerBody: vet.register_body, registerNumber: vet.register_number, country: vet.country, on: new Date(s.data.t * 1000).toISOString().slice(0, 10) };
  return vet.status === "approved" ? { status: "confirmed", ...base } : { status: "revoked", ...base };
}

export function vetRoutes(app: Hono<{ Bindings: VetEnv }>): void {
  /**
   * The owner's vet confirmation as a W3C Verifiable Credential, signed by PawID (did:web:pawid.hospet.eu).
   * Checks the seal and that the vet is still approved; the vet's details come from PawID's register.
   * Nothing is stored.
   */
  app.post("/v1/credential", async (c) => {
    const b = vetConfirmationSchema.safeParse(((await c.req.json().catch(() => null)) as { confirmation?: unknown } | null)?.confirmation);
    if (!b.success || !(await verifyVetSeal(b.data.seal, b.data.fields))) return c.json({ error: "This vet confirmation is not valid." }, 400);
    if (b.data.seal.k !== kidOf(c.env)) return c.json({ error: "Ask the PawID copy that sealed this confirmation." }, 409);
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE id = ?1").bind(b.data.seal.v).first<VetRow>();
    if (!vet || vet.status !== "approved") return c.json({ error: "The vet who confirmed this is no longer approved by PawID." }, 409);
    if (!c.env.VET_SIGNING_KEY) return c.json({ error: "Not available right now." }, 503);
    const key = await crypto.subtle.importKey("pkcs8", b64urlDecode(c.env.VET_SIGNING_KEY) as BufferSource, { name: "Ed25519" }, false, ["sign"]);
    const doc = petCredential({ issuer: c.env.CREDENTIAL_ISSUER ?? CONFIRM_ISSUERS[kidOf(c.env)]?.did, confirmation: b.data, vet: { name: vet.name, registerBody: vet.register_body, registerNumber: vet.register_number, country: vet.country } });
    return c.json(await signCredential(doc, key, kidOf(c.env)));
  });

  /** PawID's public confirmation keys, for anyone who wants to check a seal. */
  app.get("/v1/keys", (c) => c.json({ vetConfirm: Object.entries(CONFIRM_ISSUERS).map(([kid, i]) => ({ kid, alg: "Ed25519", x: i.x, api: i.api, did: i.did, name: i.name })), own: kidOf(c.env) }));

  /** A vet registers: their details and the passkey's public key. Starts as pending. */
  app.post("/v1/vets", async (c) => {
    const body = registerSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Check the form: every field except the clinic is needed." }, 400);
    const b = body.data;
    if (!(await humanCheck(c.env, b.turnstile, c.req.header("cf-connecting-ip")))) return c.json({ error: "The check that you are a person did not pass. Try again." }, 403);
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

  // ── Pairing a vet with a pet owner (6 digit code + number matching) ──────────────
  // Owner: POST /v1/pair -> code. Vet (passkey): POST /v1/pair/claim. Both phones show the same
  // 2 digit number; the owner accepts and sends their values (encrypted). The vet confirms and sends
  // the result (encrypted). Each side authenticates with its own token; the API only sees ciphertext.
  const PAIR_TTL = 15 * 60;
  const tokenHash = async (t: string) => b64urlEncode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t))));
  const pubKey = z.string().regex(/^[A-Za-z0-9_-]{87}$/);
  const cipher = z.string().regex(/^[A-Za-z0-9_-]{20,12000}$/);
  interface PairRow { id: string; code: string; owner_pub: string; owner_token: string; vet_id: string | null; vet_pub: string | null; vet_token: string | null; status: string; to_vet: string | null; to_owner: string | null; expires: number }
  const getPair = async (c: C, side: "owner" | "vet") => {
    const row = await c.env.DB.prepare("SELECT * FROM pairs WHERE id = ?1").bind(c.req.param("id")).first<PairRow>();
    const t = c.req.header("x-pair-token") ?? "";
    if (!row || row.expires < nowSec() || !t) return null;
    const want = side === "owner" ? row.owner_token : row.vet_token;
    return want && (await sameSecret(await tokenHash(t), want)) ? row : null;
  };
  // A wrong code costs a vet a try: at most 10 wrong codes per vet per 15 minutes (per Worker instance).
  const misses = new Map<string, { n: number; until: number }>();

  app.post("/v1/pair", async (c) => {
    const body = z.object({ ownerPub: pubKey }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Bad request." }, 400);
    let code = "";
    for (let i = 0; i < 8 && !code; i++) {
      const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
      const candidate = String(n).padStart(6, "0");
      const taken = await c.env.DB.prepare("SELECT 1 FROM pairs WHERE code = ?1 AND expires > ?2").bind(candidate, nowSec()).first();
      if (!taken) code = candidate;
    }
    if (!code) return c.json({ error: "Busy, try again." }, 503);
    const id = newId(16);
    const ownerToken = newId(24);
    const expires = nowSec() + PAIR_TTL;
    await c.env.DB.prepare("INSERT INTO pairs (id, code, owner_pub, owner_token, expires) VALUES (?1, ?2, ?3, ?4, ?5)")
      .bind(id, code, body.data.ownerPub, await tokenHash(ownerToken), expires).run();
    return c.json({ id, code, ownerToken, expires }, 201);
  });

  app.post("/v1/pair/claim", async (c) => {
    const body = z.object({ code: z.string().regex(/^\d{6}$/), vetId: z.string().max(24), vetPub: pubKey, at: z.number().int(), assertion: assertionSchema }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: "Type the 6 digit code the owner sees." }, 400);
    const { code, vetId, vetPub, at, assertion } = body.data;
    if (Math.abs(at - nowSec()) > 300) return c.json({ error: "Too slow. Try again." }, 400);
    const m = misses.get(vetId);
    if (m && m.until > Date.now() && m.n >= 10) return c.json({ error: "Too many wrong codes. Wait 15 minutes." }, 429);
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE id = ?1").bind(vetId).first<VetRow>();
    if (!vet || vet.status !== "approved") return c.json({ error: vet?.status === "pending" ? "Your registration is not approved yet." : "This vet account cannot confirm." }, 403);
    const challenge = await confirmChallenge(pairClaimMessage(code, vetPub, at));
    if (!(await verifyPasskeyAssertion({ publicKey: vet.public_key, alg: vet.alg, assertion, challenge, ...rp(c.env) }))) return c.json({ error: "The passkey check failed." }, 401);
    const row = await c.env.DB.prepare("SELECT * FROM pairs WHERE code = ?1 AND expires > ?2 AND status = 'waiting'").bind(code, nowSec()).first<PairRow>();
    if (!row) {
      const cur = m && m.until > Date.now() ? m : { n: 0, until: Date.now() + 15 * 60_000 };
      misses.set(vetId, { n: cur.n + 1, until: cur.until });
      return c.json({ error: "No owner is waiting with this code. Check the digits, or ask for a new code." }, 404);
    }
    const vetToken = newId(24);
    await c.env.DB.prepare("UPDATE pairs SET vet_id = ?1, vet_pub = ?2, vet_token = ?3, status = 'claimed' WHERE id = ?4 AND status = 'waiting'")
      .bind(vetId, vetPub, await tokenHash(vetToken), row.id).run();
    return c.json({ id: row.id, vetToken, ownerPub: row.owner_pub });
  });

  /** Owner polls: has a vet claimed the code? has the vet confirmed? */
  app.get("/v1/pair/:id", async (c) => {
    const row = await getPair(c, "owner");
    if (!row) return c.json({ error: "Expired. Make a new code." }, 404);
    c.header("Cache-Control", "no-store");
    if (row.status === "waiting" || row.status === "declined") return c.json({ status: row.status });
    const vet = await c.env.DB.prepare("SELECT * FROM vets WHERE id = ?1").bind(row.vet_id).first<VetRow>();
    const out = { status: row.status, vetPub: row.vet_pub, vet: vet ? { name: vet.name, registerBody: vet.register_body, registerNumber: vet.register_number, country: vet.country, clinic: vet.clinic ?? undefined } : undefined };
    if (row.status === "done") {
      await c.env.DB.prepare("DELETE FROM pairs WHERE id = ?1").bind(row.id).run();
      return c.json({ ...out, result: row.to_owner });
    }
    return c.json(out);
  });

  /** Owner: "yes, that's my vet" (with the owner's values, encrypted for the vet) or "no". */
  app.post("/v1/pair/:id/decision", async (c) => {
    const row = await getPair(c, "owner");
    const body = z.object({ accept: z.boolean(), data: cipher.optional() }).safeParse(await c.req.json().catch(() => null));
    if (!row || !body.success || row.status !== "claimed") return c.json({ error: "Expired. Make a new code." }, 404);
    if (body.data.accept && !body.data.data) return c.json({ error: "Bad request." }, 400);
    await c.env.DB.prepare("UPDATE pairs SET status = ?1, to_vet = ?2, expires = ?3 WHERE id = ?4")
      .bind(body.data.accept ? "accepted" : "declined", body.data.data ?? null, nowSec() + 30 * 60, row.id).run();
    return c.json({ status: body.data.accept ? "accepted" : "declined" });
  });

  /** Vet polls: did the owner accept? */
  app.get("/v1/pair/:id/vet", async (c) => {
    const row = await getPair(c, "vet");
    if (!row) return c.json({ error: "Expired. Ask the owner for a new code." }, 404);
    c.header("Cache-Control", "no-store");
    return c.json({ status: row.status, ...(row.status === "accepted" ? { data: row.to_vet } : {}) });
  });

  /** Vet: the confirmation, encrypted for the owner. */
  app.put("/v1/pair/:id/result", async (c) => {
    const row = await getPair(c, "vet");
    const body = z.object({ data: cipher }).safeParse(await c.req.json().catch(() => null));
    if (!row || !body.success || row.status !== "accepted") return c.json({ error: "Expired. Ask the owner for a new code." }, 404);
    await c.env.DB.prepare("UPDATE pairs SET status = 'done', to_owner = ?1, to_vet = NULL WHERE id = ?2").bind(body.data.data, row.id).run();
    return c.body(null, 204);
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

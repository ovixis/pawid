/**
 * Signed share token for the QR code shown to hotels and venues.
 *
 * IMPORTANT, read this: this token is signed by the OWNER's device key. It proves the
 * content was not changed after the QR was generated. It does NOT prove the vaccine
 * was really done. When a registered vet confirmed the microchip and rabies vaccine, the token
 * also carries the vet seal (vetSeal, see vetconfirm.ts): only those values count as confirmed,
 * and only if the API finds the vet still approved. Everything else stays "declared by the owner".
 *
 * Uses only WebCrypto, so it runs in Node 20+, browsers and Cloudflare Workers.
 *
 * Format: base64url(payload).base64url(publicKey).base64url(signature)
 * v1 payload: { v, name, microchip, rabiesValidUntil, iat, exp } (still accepted)
 * v2 payload: short keys (see SHORT) so the QR stays small; the owner picks what to share.
 */
import { z } from "zod";
import { b64urlDecode, b64urlEncode } from "./b64";
import { sameVetFields, vetSealSchema, type VetFields } from "./vetconfirm";
export { b64urlDecode, b64urlEncode } from "./b64";
import { countryCode, isoDate } from "./schema";

/** What a venue sees. Readable names, also returned by GET /api/verify. */
export const shareCardSchema = z.object({
  species: z.enum(["dog", "cat"]).optional(),
  name: z.string().min(1).max(100),
  breed: z.string().max(100).optional(),
  sex: z.enum(["female", "male"]).optional(),
  weightKg: z.number().positive().max(150).optional(),
  birthDate: isoDate.optional(),
  microchip: z.string().regex(/^\d{15}$/).optional(),
  chipDate: isoDate.optional(),
  passportNumber: z.string().max(40).optional(),
  homeCountry: countryCode.optional(),
  rabiesGivenOn: isoDate.optional(),
  rabiesValidUntil: isoDate.optional(),
  /** Vaccine name as on the passport sticker, e.g. "Nobivac Rabies". */
  rabiesVaccine: z.string().max(80).optional(),
  boosterInTime: z.boolean().optional(),
  vetName: z.string().max(120).optional(),
  vetPhone: z.string().max(40).optional(),
  /** Owner's first name only. */
  owner: z.string().max(60).optional(),
  notes: z.string().max(280).optional(),
  /** Seal of a vet confirmation of microchip and rabies (see vetconfirm.ts). */
  vetSeal: vetSealSchema.optional(),
});

export type ShareCard = z.infer<typeof shareCardSchema>;

export interface SharePayload extends ShareCard {
  v: 1 | 2;
  /** issued at / expires at, unix seconds */
  iat: number;
  exp: number;
}

export interface OwnerKeys {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

export type VerifyResult =
  | { ok: true; payload: SharePayload; keyId: string; selfDeclared: true }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "unsupported_version" };

/** Readable key -> key inside the token. Never reuse a short key for another field. */
const SHORT: Record<keyof ShareCard, string> = {
  species: "s", name: "n", breed: "b", sex: "x", weightKg: "w", birthDate: "bd",
  microchip: "c", chipDate: "cd", passportNumber: "p", homeCountry: "hc",
  rabiesGivenOn: "rg", rabiesValidUntil: "ru", rabiesVaccine: "rv", boosterInTime: "bo",
  vetName: "vn", vetPhone: "vp", owner: "o", notes: "nt", vetSeal: "vc",
};
const LONG = Object.fromEntries(Object.entries(SHORT).map(([k, s]) => [s, k])) as Record<string, keyof ShareCard>;

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function generateOwnerKeys(extractable = true): Promise<OwnerKeys> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, extractable, ["sign", "verify"])) as CryptoKeyPair;
  return { privateKey: pair.privateKey, publicKey: pair.publicKey };
}

async function rawPublicKey(key: CryptoKey): Promise<Uint8Array> {
  return new Uint8Array((await crypto.subtle.exportKey("raw", key)) as ArrayBuffer);
}

/** Short fingerprint of the public key, so a verifier can tell if the same key is used again. */
async function keyIdOf(raw: Uint8Array): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", raw as BufferSource));
  return b64urlEncode(hash.slice(0, 8));
}

/** Drops empty values so the QR carries only what the owner chose to share. */
function compact(card: ShareCard): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(card) as [keyof ShareCard, unknown][]) {
    if (v === undefined || v === null || v === "") continue;
    out[SHORT[k]] = v;
  }
  return out;
}

export async function createShareToken(
  input: ShareCard,
  keys: OwnerKeys,
  opts: { nowSec: number; ttlSec?: number },
): Promise<string> {
  const card = shareCardSchema.parse(input);
  const body = { v: 2, ...compact(card), iat: opts.nowSec, exp: opts.nowSec + (opts.ttlSec ?? 15 * 60) };
  const p = b64urlEncode(enc.encode(JSON.stringify(body)));
  const k = b64urlEncode(await rawPublicKey(keys.publicKey));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, keys.privateKey, enc.encode(`${p}.${k}`)));
  return `${p}.${k}.${b64urlEncode(sig)}`;
}

function readPayload(raw: Record<string, unknown>): SharePayload | null {
  const { v, iat, exp } = raw;
  if (typeof iat !== "number" || typeof exp !== "number") return null;
  let card: Record<string, unknown>;
  if (v === 1) {
    card = { name: raw.name, microchip: raw.microchip, rabiesValidUntil: raw.rabiesValidUntil };
  } else {
    card = {};
    for (const [s, val] of Object.entries(raw)) {
      const long = LONG[s];
      if (long) card[long] = val;
    }
  }
  const parsed = shareCardSchema.safeParse(card);
  if (!parsed.success) return null;
  return { v: v as 1 | 2, ...parsed.data, iat, exp };
}

export async function verifyShareToken(token: string, nowSec: number): Promise<VerifyResult> {
  if (token.length > 4000) return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [p, k, s] = parts as [string, string, string];
  try {
    const raw = b64urlDecode(k);
    const pub = await crypto.subtle.importKey("raw", raw as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    const valid = await crypto.subtle.verify({ name: "Ed25519" }, pub, b64urlDecode(s) as BufferSource, enc.encode(`${p}.${k}`));
    if (!valid) return { ok: false, reason: "bad_signature" };
    const body = JSON.parse(dec.decode(b64urlDecode(p))) as Record<string, unknown>;
    if (body.v !== 1 && body.v !== 2) return { ok: false, reason: "unsupported_version" };
    const payload = readPayload(body);
    if (!payload) return { ok: false, reason: "malformed" };
    if (nowSec > payload.exp) return { ok: false, reason: "expired" };
    return { ok: true, payload, keyId: await keyIdOf(raw), selfDeclared: true };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

/** Builds the card from a pet profile with only the fields the owner ticked. */
export function shareCardFrom(
  pet: import("./schema").Pet,
  pick: Partial<Record<"identity" | "passport" | "rabies" | "vet" | "notes", boolean>>,
  owner?: string,
): ShareCard {
  const rabies = pet.vaccinations
    .filter((x) => x.kind === "rabies")
    .sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
  const card: ShareCard = { name: pet.name, species: pet.species };
  if (pick.identity !== false) Object.assign(card, { breed: pet.breed, sex: pet.sex, weightKg: pet.weightKg, birthDate: pet.birthDate, microchip: pet.microchip });
  if (pick.passport) Object.assign(card, { chipDate: pet.chipDate, passportNumber: pet.passportNumber, homeCountry: pet.homeCountry });
  if (pick.rabies !== false && rabies) Object.assign(card, { rabiesGivenOn: rabies.administeredOn, rabiesValidUntil: rabies.validUntil, rabiesVaccine: rabies.product?.slice(0, 80) || undefined, boosterInTime: pet.boosterInTime });
  if (pick.vet) Object.assign(card, { vetName: pet.vet?.name, vetPhone: pet.vet?.phone });
  if (pick.notes && pet.notes) card.notes = pet.notes.slice(0, 280);
  if (owner) card.owner = owner.slice(0, 60);
  // The vet seal goes along only when the code carries exactly the values the vet confirmed.
  const vc = pet.vetConfirmation;
  if (vc && card.microchip && card.rabiesValidUntil) {
    const shown: Partial<VetFields> = { species: card.species, microchip: card.microchip, rabiesGivenOn: card.rabiesGivenOn, rabiesValidUntil: card.rabiesValidUntil, rabiesVaccine: card.rabiesVaccine };
    if (sameVetFields(vc.fields, shown)) card.vetSeal = vc.seal;
  }
  return card;
}

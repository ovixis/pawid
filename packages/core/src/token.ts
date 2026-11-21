/**
 * Signed share token for the QR code shown to hotels and venues.
 *
 * IMPORTANT, read this: this token is signed by the OWNER's device key. It proves the
 * content was not changed after the QR was generated. It does NOT prove the vaccine
 * was really done. Only a vet signature can do that (vet signing module, not built yet).
 * The verifier page must say "self declared by owner" until vet signatures exist.
 *
 * Uses only WebCrypto, so it runs in Node 20+, browsers and Cloudflare Workers.
 */

export interface SharePayload {
  v: 1;
  name: string;
  microchip: string;
  rabiesValidUntil?: string;
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

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  const pad = "=".repeat((4 - (str.length % 4)) % 4);
  const bin = atob(str.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function generateOwnerKeys(): Promise<OwnerKeys> {
  const pair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
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

/** Token format: base64url(payload).base64url(publicKey).base64url(signature) */
export async function createShareToken(
  input: Omit<SharePayload, "v" | "iat" | "exp">,
  keys: OwnerKeys,
  opts: { nowSec: number; ttlSec?: number },
): Promise<string> {
  const payload: SharePayload = {
    v: 1,
    ...input,
    iat: opts.nowSec,
    exp: opts.nowSec + (opts.ttlSec ?? 15 * 60),
  };
  const p = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const k = b64urlEncode(await rawPublicKey(keys.publicKey));
  const signingInput = enc.encode(`${p}.${k}`);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, keys.privateKey, signingInput));
  return `${p}.${k}.${b64urlEncode(sig)}`;
}

export async function verifyShareToken(token: string, nowSec: number): Promise<VerifyResult> {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [p, k, s] = parts as [string, string, string];
  try {
    const raw = b64urlDecode(k);
    const pub = await crypto.subtle.importKey("raw", raw as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    const valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      pub,
      b64urlDecode(s) as BufferSource,
      enc.encode(`${p}.${k}`),
    );
    if (!valid) return { ok: false, reason: "bad_signature" };
    const payload = JSON.parse(dec.decode(b64urlDecode(p))) as SharePayload;
    if (payload.v !== 1) return { ok: false, reason: "unsupported_version" };
    if (typeof payload.exp !== "number" || nowSec > payload.exp) return { ok: false, reason: "expired" };
    return { ok: true, payload, keyId: await keyIdOf(raw), selfDeclared: true };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

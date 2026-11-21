// Pairing a vet with a pet owner, like number matching in GitHub's sign-in.
//
// The owner's phone makes a one-time key pair and gets a 6 digit code from the PawID API. The vet
// types the code (or scans it as a QR) and their phone makes its own one-time key pair. Both phones
// then show the same 2 digit number, computed from the code and both public keys: the owner checks
// it matches the vet's screen and accepts. Everything after that (the owner's values, the vet's
// confirmation) is encrypted with a key only the two phones can compute (ECDH P-256 + HKDF +
// AES-GCM). The API passes ciphertext along and cannot read it.
import { b64urlDecode, b64urlEncode } from "./b64";

export interface PairKeys { privateKey: CryptoKey; publicKey: CryptoKey; publicRaw: string }

const ECDH = { name: "ECDH", namedCurve: "P-256" } as const;

export async function newPairKeys(): Promise<PairKeys> {
  const kp = (await crypto.subtle.generateKey(ECDH, true, ["deriveBits"])) as CryptoKeyPair;
  const raw = new Uint8Array((await crypto.subtle.exportKey("raw", kp.publicKey)) as ArrayBuffer);
  return { privateKey: kp.privateKey, publicKey: kp.publicKey, publicRaw: b64urlEncode(raw) };
}

/** Private key as JWK, to survive a page reload (kept in sessionStorage only). */
export async function exportPairKeys(k: PairKeys): Promise<JsonWebKey> {
  return (await crypto.subtle.exportKey("jwk", k.privateKey)) as JsonWebKey;
}
export async function importPairKeys(jwk: JsonWebKey): Promise<PairKeys> {
  const privateKey = await crypto.subtle.importKey("jwk", jwk, ECDH, true, ["deriveBits"]);
  const { d: _d, ...pubJwk } = jwk;
  const publicKey = await crypto.subtle.importKey("jwk", { ...pubJwk, key_ops: [] }, ECDH, true, []);
  const raw = new Uint8Array((await crypto.subtle.exportKey("raw", publicKey)) as ArrayBuffer);
  return { privateKey, publicKey, publicRaw: b64urlEncode(raw) };
}

export const isPairCode = (c: string) => /^\d{6}$/.test(c);
export const isPairPublicKey = (k: string) => /^[A-Za-z0-9_-]{87}$/.test(k); // 65 bytes, uncompressed P-256

/** The 2 digit number both phones show. Same inputs, same number; anyone in the middle changes it. */
export async function pairNumber(code: string, ownerPub: string, vetPub: string): Promise<string> {
  const bytes = new TextEncoder().encode(`pawid-pair-v1|${code}|${ownerPub}|${vetPub}`);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
  return String(((h[0]! << 8) | h[1]!) % 100).padStart(2, "0");
}

async function sharedKey(mine: PairKeys, theirPub: string, code: string): Promise<CryptoKey> {
  const their = await crypto.subtle.importKey("raw", b64urlDecode(theirPub) as BufferSource, ECDH, false, []);
  // Workers types call the field `$public`; browsers and Node use `public`.
  const bits = await crypto.subtle.deriveBits({ name: "ECDH", public: their } as unknown as Parameters<typeof crypto.subtle.deriveBits>[0], mine.privateKey, 256);
  const hk = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new TextEncoder().encode(`pawid-pair-v1|${code}`) as BufferSource, info: new TextEncoder().encode("pawid pair aes") as BufferSource },
    hk,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function pairEncrypt(mine: PairKeys, theirPub: string, code: string, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await sharedKey(mine, theirPub, code), new TextEncoder().encode(JSON.stringify(data))));
  return b64urlEncode(Uint8Array.of(...iv, ...ct));
}

export async function pairDecrypt(mine: PairKeys, theirPub: string, code: string, text: string): Promise<unknown> {
  const all = b64urlDecode(text);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) as BufferSource }, await sharedKey(mine, theirPub, code), all.slice(12) as BufferSource);
  return JSON.parse(new TextDecoder().decode(pt));
}

/** What the vet's passkey signs to claim a code: ties the code to this vet's one-time key. */
export const pairClaimMessage = (code: string, vetPub: string, at: number) => new TextEncoder().encode(`pawid-pair-claim:${code}:${vetPub}:${at}`);

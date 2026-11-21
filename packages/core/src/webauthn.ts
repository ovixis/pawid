// Checks a WebAuthn (passkey) assertion: the vet's phone signed our challenge, on our site,
// with the vet present and verified (fingerprint, face or PIN). No library: WebCrypto only.
import { b64urlDecode, b64urlEncode } from "./b64";

export interface PasskeyAssertion {
  authenticatorData: string; // base64url
  clientDataJSON: string; // base64url
  signature: string; // base64url
}

export interface PasskeyCheck {
  /** SubjectPublicKeyInfo from AuthenticatorAttestationResponse.getPublicKey(), base64url. */
  publicKey: string;
  /** COSE algorithm: -7 ES256, -8 EdDSA, -257 RS256. */
  alg: number;
  assertion: PasskeyAssertion;
  challenge: Uint8Array;
  rpId: string;
  origins: string[];
}

export const PASSKEY_ALGS = [-7, -8, -257];

const sha256 = async (b: Uint8Array) => new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource));

/** ECDSA signatures from authenticators are DER encoded; WebCrypto wants r||s. */
function derToRaw(der: Uint8Array, size = 32): Uint8Array {
  if (der[0] !== 0x30) throw new Error("not DER");
  let i = 2;
  if (der[1]! & 0x80) i = 2 + (der[1]! & 0x7f);
  const read = () => {
    if (der[i] !== 0x02) throw new Error("not an INTEGER");
    const len = der[i + 1]!;
    let v = der.slice(i + 2, i + 2 + len);
    i += 2 + len;
    while (v.length > size && v[0] === 0) v = v.slice(1);
    if (v.length > size) throw new Error("bad INTEGER");
    const out = new Uint8Array(size);
    out.set(v, size - v.length);
    return out;
  };
  const r = read();
  const s = read();
  const raw = new Uint8Array(size * 2);
  raw.set(r);
  raw.set(s, size);
  return raw;
}

export async function verifyPasskeyAssertion(o: PasskeyCheck): Promise<boolean> {
  try {
    const cdjBytes = b64urlDecode(o.assertion.clientDataJSON);
    const cd = JSON.parse(new TextDecoder().decode(cdjBytes)) as { type?: string; challenge?: string; origin?: string };
    if (cd.type !== "webauthn.get") return false;
    if (cd.challenge !== b64urlEncode(o.challenge)) return false;
    if (!cd.origin || !o.origins.includes(cd.origin)) return false;

    const auth = b64urlDecode(o.assertion.authenticatorData);
    if (auth.length < 37) return false;
    const rpHash = await sha256(new TextEncoder().encode(o.rpId));
    for (let i = 0; i < 32; i++) if (auth[i] !== rpHash[i]) return false;
    const flags = auth[32]!;
    if (!(flags & 0x01) || !(flags & 0x04)) return false; // user present and user verified

    const signed = new Uint8Array(auth.length + 32);
    signed.set(auth);
    signed.set(await sha256(cdjBytes), auth.length);
    const sig = b64urlDecode(o.assertion.signature);
    const spki = b64urlDecode(o.publicKey) as BufferSource;

    if (o.alg === -7) {
      const key = await crypto.subtle.importKey("spki", spki, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, derToRaw(sig) as BufferSource, signed as BufferSource);
    }
    if (o.alg === -8) {
      const key = await crypto.subtle.importKey("spki", spki, { name: "Ed25519" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "Ed25519" }, key, sig as BufferSource, signed as BufferSource);
    }
    if (o.alg === -257) {
      const key = await crypto.subtle.importKey("spki", spki, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
      return await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, key, sig as BufferSource, signed as BufferSource);
    }
    return false;
  } catch {
    return false;
  }
}

/** The challenge a vet signs to confirm: SHA-256 of the exact confirmation message. */
export async function confirmChallenge(message: Uint8Array): Promise<Uint8Array> {
  return sha256(message);
}

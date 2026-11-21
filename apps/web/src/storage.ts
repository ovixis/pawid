import { dogSchema, type Dog, type OwnerKeys } from "@pawid/core";

const DOGS_KEY = "pawid.dogs.v1";
const KEY_KEY = "pawid.ownerKey.v1";

export function loadDogs(): Dog[] {
  try {
    const raw = localStorage.getItem(DOGS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as unknown[]).map((d) => dogSchema.parse(d));
  } catch {
    return [];
  }
}

export function saveDogs(dogs: Dog[]): void {
  localStorage.setItem(DOGS_KEY, JSON.stringify(dogs));
}

/**
 * Owner signing key, stored as JWK in localStorage.
 * TODO: move to a non-extractable key in IndexedDB so scripts cannot read it.
 */
export async function loadOrCreateKeys(generate: () => Promise<OwnerKeys>): Promise<OwnerKeys> {
  try {
    const raw = localStorage.getItem(KEY_KEY);
    if (raw) {
      const { priv, pub } = JSON.parse(raw) as { priv: JsonWebKey; pub: JsonWebKey };
      const privateKey = await crypto.subtle.importKey("jwk", priv, { name: "Ed25519" }, true, ["sign"]);
      const publicKey = await crypto.subtle.importKey("jwk", pub, { name: "Ed25519" }, true, ["verify"]);
      return { privateKey, publicKey };
    }
  } catch {
    // fall through and create a new key
  }
  const keys = await generate();
  const priv = await crypto.subtle.exportKey("jwk", keys.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", keys.publicKey);
  localStorage.setItem(KEY_KEY, JSON.stringify({ priv, pub }));
  return keys;
}

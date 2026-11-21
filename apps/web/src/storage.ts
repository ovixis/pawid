import { petSchema, type OwnerKeys, type Pet } from "@pawid/core";

const PETS_KEY = "pawid.dogs.v1"; // name kept so pets saved by the first version still load
const KEY_KEY = "pawid.ownerKey.v1";
const OWNER_KEY = "pawid.owner.v1";

export function loadPets(): Pet[] {
  try {
    const raw = localStorage.getItem(PETS_KEY);
    if (!raw) return [];
    const out: Pet[] = [];
    for (const p of JSON.parse(raw) as unknown[]) {
      const r = petSchema.safeParse(p);
      if (r.success) out.push(r.data);
    }
    return out;
  } catch {
    return [];
  }
}

export function savePets(pets: Pet[]): void {
  localStorage.setItem(PETS_KEY, JSON.stringify(pets));
}

export function loadOwnerName(): string {
  try { return localStorage.getItem(OWNER_KEY) ?? ""; } catch { return ""; }
}
export function saveOwnerName(name: string): void {
  try { localStorage.setItem(OWNER_KEY, name); } catch { /* private mode: not remembered */ }
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

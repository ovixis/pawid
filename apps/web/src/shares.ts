// Codes this phone made, so the owner can stop one before it expires. Kept on this device only,
// and forgotten once expired. Stopping sends the code and the owner's signature over its id to the
// PawID API, which keeps only a hash of the code until it would have expired anyway.
import { generateOwnerKeys, signRevocation } from "@pawid/core";
import { API } from "./pair";
import { loadOrCreateKeys } from "./storage";

const KEY = "pawid.shares.v1";
export interface MadeCode { petId: string; token: string; made: number; exp: number; stopped?: boolean }

const now = () => Math.floor(Date.now() / 1000);

export function activeCodes(petId?: string): MadeCode[] {
  try {
    const all = (JSON.parse(localStorage.getItem(KEY) ?? "[]") as MadeCode[]).filter((c) => c.exp > now());
    localStorage.setItem(KEY, JSON.stringify(all));
    return all.filter((c) => !c.stopped && (!petId || c.petId === petId));
  } catch {
    return [];
  }
}

export function rememberCode(c: MadeCode): void {
  try { localStorage.setItem(KEY, JSON.stringify([...activeCodes(), c].slice(-50))); } catch { /* private mode: cannot be stopped later */ }
}

/** Stops a code at PawID. Resolves when the API confirmed it; throws with a readable message. */
export async function stopCode(token: string): Promise<void> {
  const keys = await loadOrCreateKeys(() => generateOwnerKeys());
  const r = await fetch(`${API}/v1/revoke`, {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
    body: JSON.stringify(await signRevocation(token, keys)),
  });
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "The code could not be stopped. Check the connection and try again.");
  try {
    const all = JSON.parse(localStorage.getItem(KEY) ?? "[]") as MadeCode[];
    localStorage.setItem(KEY, JSON.stringify(all.map((c) => (c.token === token ? { ...c, stopped: true } : c))));
  } catch { /* nothing kept */ }
}

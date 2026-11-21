// The hand-over of a vet confirmation, from the vet's phone to the owner's phone.
// The owner's phone makes a random id and a random AES key and puts both in the QR code (after "#",
// never sent to a server). The vet's phone encrypts the confirmation with that key and leaves it at
// the PawID API under that id. The owner's phone picks it up and decrypts it. The API only ever
// holds ciphertext, deletes it when read, and drops it after an hour.
import { b64urlDecode, b64urlEncode } from "@pawid/core";

/** The PawID API. VITE_API points a local build at a local API. */
export const API: string = import.meta.env.VITE_API ?? "https://pawid-api.hospet.workers.dev";

export interface VetRequest {
  /** relay id */ r: string;
  /** AES-GCM key, base64url */ k: string;
  /** what the owner entered: name, species, microchip, rabies given, until, vaccine */
  d: { n: string; s: "dog" | "cat"; c?: string; rg?: string; ru?: string; rv?: string };
}

export function newRequest(d: VetRequest["d"]): VetRequest {
  return { r: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))), k: b64urlEncode(crypto.getRandomValues(new Uint8Array(32))), d };
}

export function requestUrl(origin: string, req: VetRequest): string {
  const d = b64urlEncode(new TextEncoder().encode(JSON.stringify(req.d)));
  return `${origin}/vet#/confirm?r=${req.r}&k=${req.k}&d=${d}`;
}

export function readRequest(q: URLSearchParams): VetRequest | null {
  const r = q.get("r") ?? "", k = q.get("k") ?? "", d = q.get("d") ?? "";
  if (!/^[A-Za-z0-9_-]{22}$/.test(r) || !/^[A-Za-z0-9_-]{43}$/.test(k) || d.length > 2000) return null;
  try {
    const o = JSON.parse(new TextDecoder().decode(b64urlDecode(d))) as Record<string, unknown>;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : undefined);
    return { r, k, d: { n: str(o.n, 100) ?? "", s: o.s === "cat" ? "cat" : "dog", c: str(o.c, 15), rg: str(o.rg, 10), ru: str(o.ru, 10), rv: str(o.rv, 80) } };
  } catch {
    return null;
  }
}

async function aesKey(k: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", b64urlDecode(k) as BufferSource, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function seal(k: string, data: unknown): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(k), new TextEncoder().encode(JSON.stringify(data))));
  return b64urlEncode(Uint8Array.of(...iv, ...ct));
}

export async function open(k: string, text: string): Promise<unknown> {
  const all = b64urlDecode(text);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) as BufferSource }, await aesKey(k), all.slice(12) as BufferSource);
  return JSON.parse(new TextDecoder().decode(pt));
}

/** Owner's phone: has the vet answered? null while waiting. */
export async function pickUp(req: VetRequest, signal?: AbortSignal): Promise<unknown | null> {
  const r = await fetch(`${API}/v1/relay/${req.r}`, { signal, cache: "no-store", credentials: "omit" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`relay ${r.status}`);
  const { data } = (await r.json()) as { data: string };
  return open(req.k, data);
}

export async function handOver(req: VetRequest, data: unknown): Promise<void> {
  const r = await fetch(`${API}/v1/relay/${req.r}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: await seal(req.k, data) }), credentials: "omit" });
  if (!r.ok) throw new Error(`relay ${r.status}`);
}

// Backup and restore, all on the device.
// The backup is the pets' details as JSON. It travels as a file, or packed (gzip + base64url) into a
// restore link: https://pawid.pages.dev/#/restore?b=<code>. The code is after "#", so browsers never
// send it to a server. PawID keeps no copy.
// The signing key is not in the backup: a new one is made on the new phone, and codes made before
// still verify (each code carries its own public key).
import { b64urlDecode, b64urlEncode, petSchema, type Pet } from "@pawid/core";

export interface Backup {
  app: "pawid";
  v: 1;
  createdAt: string;
  owner?: string;
  pets: Pet[];
}

const LAST_KEY = "pawid.lastBackup.v1";
const MAX_CODE = 200_000;

export function makeBackup(pets: Pet[], owner: string): Backup {
  return { app: "pawid", v: 1, createdAt: new Date().toISOString(), ...(owner ? { owner } : {}), pets };
}

/** Checks everything that comes in: a backup is data from outside, like a form. */
export function readBackup(raw: unknown): Backup | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.app !== "pawid" || o.v !== 1 || !Array.isArray(o.pets) || o.pets.length > 50) return null;
  const pets: Pet[] = [];
  for (const p of o.pets) {
    const r = petSchema.safeParse(p);
    if (r.success) pets.push(r.data);
  }
  if (!pets.length) return null;
  const createdAt = typeof o.createdAt === "string" && !Number.isNaN(Date.parse(o.createdAt)) ? o.createdAt : new Date(0).toISOString();
  const owner = typeof o.owner === "string" ? o.owner.trim().slice(0, 60) : "";
  return { app: "pawid", v: 1, createdAt, ...(owner ? { owner } : {}), pets };
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** "g." + gzip, or "j." + plain JSON where the browser has no CompressionStream. */
export async function encodeBackup(b: Backup): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(b));
  if (typeof CompressionStream === "function") return "g." + b64urlEncode(await pipe(json, new CompressionStream("gzip")));
  return "j." + b64urlEncode(json);
}

export async function decodeBackup(code: string): Promise<Backup | null> {
  try {
    const c = code.trim();
    if (c.length > MAX_CODE) return null;
    const [kind, data = ""] = [c.slice(0, 2), c.slice(2)];
    let bytes = b64urlDecode(data);
    if (kind === "g.") {
      if (typeof DecompressionStream !== "function") return null;
      bytes = await pipe(bytes, new DecompressionStream("gzip"));
    } else if (kind !== "j.") return null;
    return readBackup(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/** The code inside a restore link, a bare code, or a backup file's JSON text. */
export async function backupFromText(text: string): Promise<Backup | null> {
  const t = text.trim();
  if (t.startsWith("{")) { try { return readBackup(JSON.parse(t)); } catch { return null; } }
  const m = t.match(/[#?&]b=([A-Za-z0-9_.-]+)/);
  return decodeBackup(m ? m[1]! : t);
}

export function restoreLink(code: string): string {
  return `${location.origin}/#/restore?b=${code}`;
}

/** Backup pets replace pets with the same id; other pets on the phone stay. */
export function mergePets(current: Pet[], incoming: Pet[]): Pet[] {
  const byId = new Map(current.map((p) => [p.id, p] as const));
  for (const p of incoming) byId.set(p.id, p);
  return [...byId.values()];
}

export function lastBackup(): string | null {
  try { return localStorage.getItem(LAST_KEY); } catch { return null; }
}
export function markBackedUp(): void {
  try { localStorage.setItem(LAST_KEY, new Date().toISOString()); } catch { /* private mode */ }
}

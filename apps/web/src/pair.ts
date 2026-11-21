// Client for the vet-owner pairing endpoints (see packages/core/src/pairing.ts for the scheme).
export const API: string = import.meta.env.VITE_API ?? "https://pawid-api.hospet.workers.dev";

export class PairGone extends Error {}

async function call<T>(path: string, o: { method?: string; body?: unknown; token?: string } = {}): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: o.method ?? (o.body ? "POST" : "GET"),
    headers: { ...(o.body ? { "Content-Type": "application/json" } : {}), ...(o.token ? { "X-Pair-Token": o.token } : {}) },
    body: o.body ? JSON.stringify(o.body) : undefined,
    credentials: "omit",
    cache: "no-store",
  });
  if (r.status === 204) return undefined as T;
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (r.status === 404 && path.startsWith("/v1/pair/") && !path.endsWith("/claim")) throw new PairGone(data.error ?? "Expired.");
  if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`);
  return data;
}

export interface VetPublic { name: string; registerBody?: string; registerNumber?: string; country?: string; clinic?: string }
export type OwnerPoll = { status: "waiting" | "declined" } | { status: "claimed" | "accepted" | "done"; vetPub: string; vet?: VetPublic; result?: string };

export const createPair = (ownerPub: string) => call<{ id: string; code: string; ownerToken: string; expires: number }>("/v1/pair", { body: { ownerPub } });
export const ownerPoll = (id: string, token: string) => call<OwnerPoll>(`/v1/pair/${id}`, { token });
export const ownerDecide = (id: string, token: string, accept: boolean, data?: string) => call<{ status: string }>(`/v1/pair/${id}/decision`, { token, body: { accept, data } });
export const claimPair = (body: unknown) => call<{ id: string; vetToken: string; ownerPub: string }>("/v1/pair/claim", { body });
export const vetPoll = (id: string, token: string) => call<{ status: string; data?: string }>(`/v1/pair/${id}/vet`, { token });
export const sendResult = (id: string, token: string, data: string) => call<void>(`/v1/pair/${id}/result`, { method: "PUT", token, body: { data } });

export const spaced = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

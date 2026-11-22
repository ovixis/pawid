import { describe, expect, it } from "vitest";
import { createShareToken, generateOwnerKeys } from "@pawid/core";
import { app } from "../src/index";

/** Fake D1 that records every bound statement. */
function fakeDb(rows: unknown[] = []) {
  const writes: unknown[][] = [];
  const DB = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        run: async () => { writes.push([sql, ...args]); return {}; },
        all: async () => ({ results: rows }),
        first: async () => null,
      }),
    }),
  };
  return { DB: DB as unknown as D1Database, writes };
}

const nowSec = () => Math.floor(Date.now() / 1000);
const rpc = (env: object, body: unknown, ua = "Claude-User") =>
  app.request("/mcp", { method: "POST", headers: { "content-type": "application/json", "user-agent": ua }, body: JSON.stringify(body) }, env);

describe("v1 api", () => {
  it("rules: EU base with sources and a disclaimer, CORS open", async () => {
    const res = await app.request("/v1/rules", {}, fakeDb());
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = (await res.json()) as { rules: { sources: string[]; status: string }[]; disclaimer: string };
    expect(body.rules.length).toBeGreaterThan(3);
    expect(body.rules.every((r) => r.sources.length > 0)).toBe(true);
    expect(body.disclaimer).toMatch(/not official/i);
  });
  it("rules: bad country code is a 400", async () => {
    expect((await app.request("/v1/rules?country=Italy", {}, fakeDb())).status).toBe(400);
  });
  it("openapi is served", async () => {
    const spec = (await (await app.request("http://x.test/v1/openapi.json", {}, fakeDb())).json()) as { openapi: string; servers: { url: string }[] };
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0]?.url).toBe("http://x.test");
  });
  it("verify page counts the result and the country, never pet data", async () => {
    const env = fakeDb();
    const token = await createShareToken({ name: "Secretname", microchip: "380260000123456" }, await generateOwnerKeys(), { nowSec: nowSec() });
    await app.request(`/v/${token}`, { headers: { "cf-connecting-ip": "1.2.3.4" } }, env);
    expect(env.writes).toHaveLength(1);
    const flat = JSON.stringify(env.writes);
    expect(flat).toContain("verify.page.ok");
    expect(flat).not.toMatch(/Secretname|380260000123456|1\.2\.3\.4/);
  });
  it("stats needs the key", async () => {
    const env = { ...fakeDb([{ day: "2026-11-21", metric: "api.rules", dim: "EU", count: 3 }]), STATS_KEY: "k".repeat(32) };
    expect((await app.request("/v1/stats", {}, env)).status).toBe(401);
    expect((await app.request("/v1/stats", { headers: { authorization: "Bearer wrong" } }, env)).status).toBe(401);
    const ok = await app.request("/v1/stats", { headers: { authorization: `Bearer ${"k".repeat(32)}` } }, env);
    expect(ok.status).toBe(200);
    expect(((await ok.json()) as { rows: unknown[] }).rows).toHaveLength(1);
  });
  it("stats is closed when no key is configured", async () => {
    expect((await app.request("/v1/stats", { headers: { authorization: "Bearer " } }, fakeDb())).status).toBe(401);
  });
});

describe("mcp", () => {
  it("initialize names PawID and says it is not official", async () => {
    const env = fakeDb();
    const res = await rpc(env, { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    const body = (await res.json()) as { result: { protocolVersion: string; serverInfo: { name: string }; instructions: string } };
    expect(body.result.protocolVersion).toBe("2025-06-18");
    expect(body.result.serverInfo.name).toBe("pawid");
    expect(body.result.instructions).toMatch(/NOT an official document/);
    expect(JSON.stringify(env.writes)).toContain("claude-user");
  });
  it("lists three read-only tools", async () => {
    const body = (await (await rpc(fakeDb(), { jsonrpc: "2.0", id: 2, method: "tools/list" })).json()) as { result: { tools: { name: string; annotations: { readOnlyHint: boolean } }[] } };
    expect(body.result.tools.map((t) => t.name)).toEqual(["verify_pet_card", "get_pet_travel_rules", "list_rule_countries"]);
    expect(body.result.tools.every((t) => t.annotations.readOnlyHint)).toBe(true);
  });
  it("verify_pet_card takes a full link and says vet did not verify", async () => {
    const token = await createShareToken({ name: "Rex", microchip: "380260000123456" }, await generateOwnerKeys(), { nowSec: nowSec() });
    const body = (await (await rpc(fakeDb(), { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "verify_pet_card", arguments: { code: `https://pawid-api.example/v/${token}` } } })).json()) as { result: { structuredContent: { valid: boolean; verifiedByVet: boolean; card: { name: string } } } };
    expect(body.result.structuredContent).toMatchObject({ valid: true, verifiedByVet: false, card: { name: "Rex" } });
  });
  it("verify_pet_card on a changed code is not valid", async () => {
    const token = await createShareToken({ name: "Rex" }, await generateOwnerKeys(), { nowSec: nowSec() });
    const bad = token.slice(0, 10) + (token[10] === "A" ? "B" : "A") + token.slice(11);
    const body = (await (await rpc(fakeDb(), { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "verify_pet_card", arguments: { code: bad } } })).json()) as { result: { structuredContent: { valid: boolean } } };
    expect(body.result.structuredContent.valid).toBe(false);
  });
  it("get_pet_travel_rules rejects a country name with a tool error", async () => {
    const body = (await (await rpc(fakeDb(), { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "get_pet_travel_rules", arguments: { country: "Italy" } } })).json()) as { result: { isError: boolean } };
    expect(body.result.isError).toBe(true);
  });
  it("notifications get 202, unknown methods an error, bad JSON a 400", async () => {
    expect((await rpc(fakeDb(), { jsonrpc: "2.0", method: "notifications/initialized" })).status).toBe(202);
    const unk = (await (await rpc(fakeDb(), { jsonrpc: "2.0", id: 6, method: "nope" })).json()) as { error: { code: number } };
    expect(unk.error.code).toBe(-32601);
    const res = await app.request("/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }, fakeDb());
    expect(res.status).toBe(400);
  });
});

describe("widget counter", () => {
  it("counts a known component by site host, ignores unknown names", async () => {
    const env = fakeDb();
    const ok = await app.request("/v1/w?c=policy", { headers: { origin: "https://www.trattoria-example.it" } }, env);
    expect(ok.status).toBe(204);
    await app.request("/v1/w?c=<script>", { headers: { origin: "https://x.test" } }, env);
    expect(env.writes).toHaveLength(1);
    expect(JSON.stringify(env.writes)).toContain("widget.policy");
    expect(JSON.stringify(env.writes)).toContain("www.trattoria-example.it");
  });
});

describe("stopping a code", () => {
  it("only the owner can stop it, and a stopped code no longer verifies", async () => {
    const { createShareToken, generateOwnerKeys, signRevocation } = await import("@pawid/core");
    const { app } = await import("../src/index");
    const stopped = new Set<string>();
    const DB = {
      prepare: (sql: string) => ({
        bind: (...a: unknown[]) => ({
          run: async () => { if (sql.includes("revoked_shares")) stopped.add(String(a[0])); return {}; },
          all: async () => ({ results: [] }),
          first: async () => (sql.includes("revoked_shares") && stopped.has(String(a[0])) ? { 1: 1 } : null),
        }),
      }),
    } as unknown as D1Database;
    const owner = await generateOwnerKeys();
    const other = await generateOwnerKeys();
    const token = await createShareToken({ name: "Bruno", species: "dog" }, owner, { nowSec: Math.floor(Date.now() / 1000), ttlSec: 900 });
    const post = (body: unknown) => app.request("/v1/revoke", { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.9" }, body: JSON.stringify(body) }, { DB });
    expect((await app.request(`/v1/verify?token=${token}`, {}, { DB })).status).toBe(200);
    expect((await post(await signRevocation(token, other))).status).toBe(403);
    expect((await post(await signRevocation(token, owner))).status).toBe(200);
    const after = await app.request(`/v1/verify?token=${token}`, {}, { DB });
    expect(after.status).toBe(400);
    expect(((await after.json()) as { reason: string }).reason).toBe("revoked");
  });
});

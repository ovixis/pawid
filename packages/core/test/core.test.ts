import { describe, expect, it } from "vitest";
import {
  checkRabies,
  createShareToken,
  dogSchema,
  generateOwnerKeys,
  remindersFor,
  verifyShareToken,
  type Dog,
} from "../src";

const dog: Dog = dogSchema.parse({
  id: "d1",
  name: "Rex",
  microchip: "380260000123456",
  vaccinations: [
    { kind: "rabies", administeredOn: "2025-06-01", validUntil: "2026-12-01" },
    { kind: "other", administeredOn: "2025-06-01", validUntil: "2026-06-01" },
  ],
});

describe("schema", () => {
  it("rejects a microchip that is not 15 digits", () => {
    expect(() => dogSchema.parse({ id: "x", name: "A", microchip: "123" })).toThrow();
  });
});

describe("rabies check", () => {
  it("valid when far from expiry", () => {
    expect(checkRabies(dog, "2026-01-01").status).toBe("valid");
  });
  it("expiring soon inside the window", () => {
    const r = checkRabies(dog, "2026-11-10");
    expect(r.status).toBe("expiring_soon");
    expect(r.daysLeft).toBe(21);
  });
  it("expired after validUntil", () => {
    expect(checkRabies(dog, "2026-12-02").status).toBe("expired");
  });
  it("missing when no rabies entry", () => {
    expect(checkRabies({ ...dog, vaccinations: [] }, "2026-01-01").status).toBe("missing");
  });
  it("uses the latest rabies entry", () => {
    const d: Dog = {
      ...dog,
      vaccinations: [
        { kind: "rabies", administeredOn: "2023-01-01", validUntil: "2024-01-01" },
        { kind: "rabies", administeredOn: "2024-01-01", validUntil: "2027-01-01" },
      ],
    };
    expect(checkRabies(d, "2026-06-01").status).toBe("valid");
  });
});

describe("reminders", () => {
  it("creates 30 and 7 day reminders and drops past ones", () => {
    const r = remindersFor(dog, "2026-11-15");
    expect(r.map((x) => x.sendOn)).toEqual(["2026-11-24"]);
  });
});

describe("share token", () => {
  const now = 1_800_000_000;
  const input = { name: "Rex", microchip: "380260000123456", rabiesValidUntil: "2026-12-01" };

  it("round trip works and is marked self declared", async () => {
    const keys = await generateOwnerKeys();
    const token = await createShareToken(input, keys, { nowSec: now });
    const res = await verifyShareToken(token, now + 60);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.name).toBe("Rex");
      expect(res.selfDeclared).toBe(true);
    }
  });

  it("fails after expiry", async () => {
    const keys = await generateOwnerKeys();
    const token = await createShareToken(input, keys, { nowSec: now, ttlSec: 60 });
    const res = await verifyShareToken(token, now + 61);
    expect(res).toEqual({ ok: false, reason: "expired" });
  });

  it("detects a changed payload", async () => {
    const keys = await generateOwnerKeys();
    const token = await createShareToken(input, keys, { nowSec: now });
    const [p, k, s] = token.split(".") as [string, string, string];
    const fake = btoa(JSON.stringify({ v: 1, ...input, rabiesValidUntil: "2030-01-01", iat: now, exp: now + 900 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(fake).not.toBe(p);
    const res = await verifyShareToken(`${fake}.${k}.${s}`, now + 10);
    expect(res).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects garbage", async () => {
    expect(await verifyShareToken("abc", now)).toEqual({ ok: false, reason: "malformed" });
  });
});

import { describe, expect, it } from "vitest";
import {
  b64urlEncode,
  createShareToken,
  generateOwnerKeys,
  petSchema,
  shareCardFrom,
  verifyShareToken,
  type OwnerKeys,
} from "../src";

const now = 1_800_000_000;
const enc = new TextEncoder();

/** Signs any body, to test what the verifier does with tokens made by other software. */
async function signRaw(body: unknown, keys: OwnerKeys): Promise<string> {
  const p = b64urlEncode(enc.encode(JSON.stringify(body)));
  const k = b64urlEncode(new Uint8Array((await crypto.subtle.exportKey("raw", keys.publicKey)) as ArrayBuffer));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, keys.privateKey, enc.encode(`${p}.${k}`)));
  return `${p}.${k}.${b64urlEncode(sig)}`;
}

const pet = petSchema.parse({
  id: "p1",
  species: "cat",
  name: "Miso",
  breed: "European shorthair",
  sex: "female",
  weightKg: 4.2,
  birthDate: "2022-03-01",
  microchip: "380260000123456",
  chipDate: "2022-05-01",
  passportNumber: "IT-123456",
  homeCountry: "IT",
  vaccinations: [
    { kind: "rabies", administeredOn: "2025-01-10", validUntil: "2026-01-10" },
    { kind: "rabies", administeredOn: "2026-01-05", validUntil: "2029-01-05" },
  ],
  boosterInTime: true,
  vet: { name: "Clinica San Marco", phone: "+39 055 000000" },
  notes: "Shy with big dogs.",
});

describe("share token v2", () => {
  it("round trip with every field, readable names out", async () => {
    const keys = await generateOwnerKeys();
    const card = shareCardFrom(pet, { identity: true, passport: true, rabies: true, vet: true, notes: true }, "Anna");
    const res = await verifyShareToken(await createShareToken(card, keys, { nowSec: now }), now + 1);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.payload).toMatchObject({
      v: 2, species: "cat", name: "Miso", sex: "female", weightKg: 4.2, homeCountry: "IT",
      rabiesGivenOn: "2026-01-05", rabiesValidUntil: "2029-01-05", boosterInTime: true,
      vetName: "Clinica San Marco", owner: "Anna", notes: "Shy with big dogs.",
    });
  });

  it("shares only what the owner ticked", () => {
    const card = shareCardFrom(pet, { identity: true, rabies: true });
    expect(card.vetName).toBeUndefined();
    expect(card.passportNumber).toBeUndefined();
    expect(card.notes).toBeUndefined();
    expect(card.microchip).toBe("380260000123456");
  });

  it("keeps the QR small: the minimal card is under 400 characters", async () => {
    const keys = await generateOwnerKeys();
    const t = await createShareToken(shareCardFrom(pet, { identity: true, rabies: true }), keys, { nowSec: now });
    expect(t.length).toBeLessThan(400);
  });

  it("still accepts a v1 token", async () => {
    const keys = await generateOwnerKeys();
    const t = await signRaw({ v: 1, name: "Rex", microchip: "380260000123456", rabiesValidUntil: "2026-12-01", iat: now, exp: now + 900 }, keys);
    const res = await verifyShareToken(t, now + 1);
    expect(res.ok && res.payload.name).toBe("Rex");
  });

  it("rejects a signed token with bad data (malformed, not shown)", async () => {
    const keys = await generateOwnerKeys();
    const t = await signRaw({ v: 2, n: "Rex", c: "12<script>", iat: now, exp: now + 900 }, keys);
    expect(await verifyShareToken(t, now + 1)).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects an unknown version", async () => {
    const keys = await generateOwnerKeys();
    const t = await signRaw({ v: 9, n: "Rex", iat: now, exp: now + 900 }, keys);
    expect(await verifyShareToken(t, now + 1)).toEqual({ ok: false, reason: "unsupported_version" });
  });
});

describe("pet schema", () => {
  it("defaults to a dog and allows a pet without a chip yet", () => {
    const p = petSchema.parse({ id: "x", name: "Bea" });
    expect(p.species).toBe("dog");
    expect(p.microchip).toBeUndefined();
  });
  it("rejects a lower case country code", () => {
    expect(() => petSchema.parse({ id: "x", name: "Bea", homeCountry: "it" })).toThrow();
  });
});

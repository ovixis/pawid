import { describe, expect, it } from "vitest";
import {
  b64urlEncode, base58btc, checkRevocation, createShareToken, ed25519Multikey, fromBase58btc, generateOwnerKeys, jcs, petCredential,
  rawFromMultikey, shareId, signCredential, signRevocation, verifyCredential, type VetConfirmation,
} from "../src";

describe("stopping a code", () => {
  it("accepts the owner's signature and refuses anyone else's", async () => {
    const owner = await generateOwnerKeys();
    const other = await generateOwnerKeys();
    const token = await createShareToken({ name: "Bruno", species: "dog" }, owner, { nowSec: 1_800_000_000, ttlSec: 900 });
    const mine = await signRevocation(token, owner);
    expect(await checkRevocation(token, mine.sig)).toBe(true);
    const theirs = await signRevocation(token, other);
    expect(await checkRevocation(token, theirs.sig)).toBe(false);
    // The id is stable for a code and different for another code.
    const token2 = await createShareToken({ name: "Bruno", species: "dog" }, owner, { nowSec: 1_800_000_001, ttlSec: 900 });
    expect(await shareId(token)).toBe(await shareId(token));
    expect(await shareId(token)).not.toBe(await shareId(token2));
    expect(await checkRevocation(token2, mine.sig)).toBe(false);
  });
});

describe("verifiable credential", () => {
  it("encodes base58btc and Ed25519 multikeys like the spec examples", () => {
    expect(base58btc(new TextEncoder().encode("Hello World!"))).toBe("2NEpo7TZRRrLZSi2U");
    expect(Array.from(fromBase58btc("2NEpo7TZRRrLZSi2U"))).toEqual(Array.from(new TextEncoder().encode("Hello World!")));
    expect(base58btc(Uint8Array.of(0, 0, 1))).toBe("112");
    const raw = new Uint8Array(32).fill(7);
    const mk = ed25519Multikey(raw);
    expect(mk.startsWith("z6Mk")).toBe(true);
    expect(Array.from(rawFromMultikey(mk))).toEqual(Array.from(raw));
  });

  it("canonicalises with sorted keys and no spaces", () => {
    expect(jcs({ b: 1, a: [true, null, "x"], c: { z: "é", y: 2 } })).toBe('{"a":[true,null,"x"],"b":1,"c":{"y":2,"z":"é"}}');
  });

  it("signs and verifies; any change breaks it", async () => {
    const k = await generateOwnerKeys();
    const pub = b64urlEncode(new Uint8Array((await crypto.subtle.exportKey("raw", k.publicKey)) as ArrayBuffer));
    const conf: VetConfirmation = {
      seal: { v: "vet_abc123", t: 1_795_000_000, k: "s1", s: "A".repeat(86) },
      fields: { species: "dog", microchip: "380260000123456", rabiesGivenOn: "2026-06-01", rabiesValidUntil: "2029-06-01", rabiesVaccine: "Nobivac Rabies" },
      vet: { name: "Dr Rossi" },
    };
    const doc = petCredential({ confirmation: conf, vet: { name: "Dr Anna Rossi", registerBody: "FNOVI", registerNumber: "1234", country: "IT" } });
    const vc = await signCredential(doc, k.privateKey, "s1", new Date("2026-11-22T10:00:00Z"));
    expect(await verifyCredential(vc, { s1: pub })).toBe(true);
    const sub = vc.credentialSubject as Record<string, unknown>;
    expect(sub).not.toHaveProperty("name"); // the pet's name is never in it
    expect(await verifyCredential({ ...vc, credentialSubject: { ...sub, microchip: "380260000999999" } }, { s1: pub })).toBe(false);
    expect(await verifyCredential(vc, { s2: pub })).toBe(false);
  });
});

describe("did:web document", () => {
  it("publishes exactly PawID's confirmation keys", async () => {
    const { readFileSync } = await import("node:fs");
    const { VET_CONFIRM_KEYS, b64urlDecode: dec } = await import("../src");
    const did = JSON.parse(readFileSync(new URL("../../../apps/web/public/.well-known/did.json", import.meta.url), "utf8")) as { verificationMethod: { id: string; publicKeyMultibase: string }[] };
    expect(did.verificationMethod.map((v) => v.id)).toEqual(Object.keys(VET_CONFIRM_KEYS).map((k) => `did:web:pawid.hospet.eu#${k}`));
    for (const v of did.verificationMethod) expect(v.publicKeyMultibase).toBe(ed25519Multikey(dec(VET_CONFIRM_KEYS[v.id.split("#")[1]!]!)));
  });
});

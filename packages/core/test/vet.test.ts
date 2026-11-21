import { describe, expect, it } from "vitest";
import {
  b64urlEncode, confirmChallenge, createShareToken, generateOwnerKeys, sameVetFields, shareCardFrom, verifyPasskeyAssertion,
  verifyShareToken, verifyVetSeal, vetConfirmMessage, type Pet, type VetFields,
} from "../src";

const enc = new TextEncoder();
const sha = async (b: Uint8Array) => new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource));

/** r||s to DER, as authenticators send ECDSA signatures. */
function rawToDer(raw: Uint8Array): Uint8Array {
  const int = (b: Uint8Array) => {
    let v = b;
    while (v.length > 1 && v[0] === 0 && !(v[1]! & 0x80)) v = v.slice(1);
    if (v[0]! & 0x80) v = Uint8Array.of(0, ...v);
    return Uint8Array.of(0x02, v.length, ...v);
  };
  const body = Uint8Array.of(...int(raw.slice(0, 32)), ...int(raw.slice(32)));
  return Uint8Array.of(0x30, body.length, ...body);
}

/** A fake phone: a P-256 passkey that signs like a real authenticator. */
async function fakePasskey(rpId = "pawid.hospet.eu", origin = "https://pawid.hospet.eu", flags = 0x05) {
  const kp = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])) as CryptoKeyPair;
  const publicKey = b64urlEncode(new Uint8Array(await crypto.subtle.exportKey("spki", kp.publicKey)));
  const sign = async (challenge: Uint8Array) => {
    const auth = new Uint8Array(37);
    auth.set(await sha(enc.encode(rpId)));
    auth[32] = flags;
    const cdj = enc.encode(JSON.stringify({ type: "webauthn.get", challenge: b64urlEncode(challenge), origin }));
    const data = Uint8Array.of(...auth, ...(await sha(cdj)));
    const raw = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, kp.privateKey, data as BufferSource));
    return { authenticatorData: b64urlEncode(auth), clientDataJSON: b64urlEncode(cdj), signature: b64urlEncode(rawToDer(raw)) };
  };
  return { publicKey, sign };
}

const fields: VetFields = { species: "dog", microchip: "380260000123456", rabiesGivenOn: "2026-03-01", rabiesValidUntil: "2029-03-01", rabiesVaccine: "Nobivac Rabies" };
const site = { rpId: "pawid.hospet.eu", origins: ["https://pawid.hospet.eu"] };

describe("passkey check", () => {
  it("accepts the vet's signature over the confirmation", async () => {
    const pk = await fakePasskey();
    const challenge = await confirmChallenge(vetConfirmMessage("vet123", 1000, fields));
    expect(await verifyPasskeyAssertion({ publicKey: pk.publicKey, alg: -7, assertion: await pk.sign(challenge), challenge, ...site })).toBe(true);
  });
  it("refuses changed values, another site, and no fingerprint", async () => {
    const pk = await fakePasskey();
    const challenge = await confirmChallenge(vetConfirmMessage("vet123", 1000, fields));
    const other = await confirmChallenge(vetConfirmMessage("vet123", 1000, { ...fields, rabiesValidUntil: "2030-03-01" }));
    expect(await verifyPasskeyAssertion({ publicKey: pk.publicKey, alg: -7, assertion: await pk.sign(challenge), challenge: other, ...site })).toBe(false);
    const evil = await fakePasskey("pawid.hospet.eu", "https://evil.example");
    expect(await verifyPasskeyAssertion({ publicKey: evil.publicKey, alg: -7, assertion: await evil.sign(challenge), challenge, ...site })).toBe(false);
    const noUv = await fakePasskey(undefined, undefined, 0x01);
    expect(await verifyPasskeyAssertion({ publicKey: noUv.publicKey, alg: -7, assertion: await noUv.sign(challenge), challenge, ...site })).toBe(false);
  });
});

describe("vet seal in the QR code", () => {
  async function sealed() {
    const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
    const x = b64urlEncode(new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)));
    const s = b64urlEncode(new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, kp.privateKey, vetConfirmMessage("vet123", 1000, fields) as BufferSource)));
    return { keys: { t1: x }, seal: { v: "vet123", t: 1000, k: "t1", s } };
  }
  it("holds for the same values and breaks when one changes", async () => {
    const { keys, seal } = await sealed();
    expect(await verifyVetSeal(seal, fields, keys)).toBe(true);
    expect(await verifyVetSeal(seal, { ...fields, microchip: "380260000123457" }, keys)).toBe(false);
    expect(await verifyVetSeal({ ...seal, k: "unknown" }, fields, keys)).toBe(false);
  });
  it("travels in the code only when the shared values are the confirmed ones", async () => {
    const { seal } = await sealed();
    const pet = { id: "p", species: "dog", name: "Luna", microchip: fields.microchip, treatments: [],
      vaccinations: [{ kind: "rabies", product: "Nobivac Rabies", administeredOn: fields.rabiesGivenOn, validUntil: fields.rabiesValidUntil }],
      vetConfirmation: { seal, fields, vet: { name: "Dr Rossi" } } } as unknown as Pet;
    const card = shareCardFrom(pet, { identity: true, rabies: true });
    expect(card.vetSeal).toEqual(seal);
    expect(shareCardFrom(pet, { identity: false, rabies: true }).vetSeal).toBeUndefined();
    const edited = { ...pet, vaccinations: [{ ...pet.vaccinations[0]!, validUntil: "2030-01-01" }] } as Pet;
    expect(shareCardFrom(edited, { identity: true, rabies: true }).vetSeal).toBeUndefined();
    const t = await createShareToken(card, await generateOwnerKeys(), { nowSec: 2000, ttlSec: 60 });
    const r = await verifyShareToken(t, 2001);
    expect(r.ok && r.payload.vetSeal).toEqual(seal);
    expect(t.length).toBeLessThan(900);
  });
  it("compares fields the same way on both sides", () => {
    expect(sameVetFields(fields, { ...fields })).toBe(true);
    expect(sameVetFields({ ...fields, rabiesVaccine: undefined }, { ...fields, rabiesVaccine: "" })).toBe(true);
  });
});

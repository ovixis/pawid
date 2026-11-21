// Vet confirmation: a registered vet confirms a pet's microchip and rabies vaccination.
//
// The vet signs with a passkey on their own phone (WebAuthn, fingerprint or face). The PawID API
// checks that signature and that the vet is approved, then seals the confirmed values with the
// PawID confirmation key below. The seal is small enough to travel inside the pet's QR code.
// A venue checks the seal against the values in the code: if the owner changed any of them, the
// seal no longer matches. The API also checks the vet was not revoked since.
import { z } from "zod";
import { b64urlDecode } from "./b64";

/** PawID confirmation keys (Ed25519, raw, base64url). The private key is a secret of the API Worker. */
export const VET_CONFIRM_KEYS: Record<string, string> = {
  s1: "fSijUx8PN_n-AwqOHHUbg9JLqJ2laxTX_QMrr12gc7I",
};

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** The values a vet confirms, as they are in the passport. */
export const vetFieldsSchema = z.object({
  species: z.enum(["dog", "cat"]),
  microchip: z.string().regex(/^\d{15}$/),
  rabiesGivenOn: iso,
  rabiesValidUntil: iso,
  rabiesVaccine: z.string().max(80).optional(),
});
export type VetFields = z.infer<typeof vetFieldsSchema>;

/** The seal: vet id, time (unix seconds), PawID key id, signature. Short keys: it goes in the QR. */
export const vetSealSchema = z.object({
  v: z.string().regex(/^[A-Za-z0-9_-]{6,24}$/),
  t: z.number().int().positive(),
  k: z.string().regex(/^[a-z0-9]{1,8}$/),
  s: z.string().regex(/^[A-Za-z0-9_-]{80,100}$/),
});
export type VetSeal = z.infer<typeof vetSealSchema>;

/** What the owner's phone keeps: the seal, the values it covers, and who the vet is (for display). */
export const vetConfirmationSchema = z.object({
  seal: vetSealSchema,
  fields: vetFieldsSchema,
  vet: z.object({
    name: z.string().max(120),
    registerBody: z.string().max(160).optional(),
    registerNumber: z.string().max(40).optional(),
    country: z.string().regex(/^[A-Z]{2}$/).optional(),
  }),
});
export type VetConfirmation = z.infer<typeof vetConfirmationSchema>;

/** The exact bytes that are signed. Order and spelling never change for version 1. */
export function vetConfirmMessage(vetId: string, at: number, f: VetFields): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(["pawid-vc", 1, vetId, at, f.species, f.microchip, f.rabiesGivenOn, f.rabiesValidUntil, f.rabiesVaccine ?? ""]));
}

export function sameVetFields(a: VetFields, b: Partial<VetFields>): boolean {
  return a.species === (b.species ?? "dog") && a.microchip === b.microchip && a.rabiesGivenOn === b.rabiesGivenOn
    && a.rabiesValidUntil === b.rabiesValidUntil && (a.rabiesVaccine ?? "") === (b.rabiesVaccine ?? "");
}

/** Checks the PawID seal over these values. Does not check whether the vet was revoked: the API does that. */
export async function verifyVetSeal(seal: VetSeal, f: VetFields, keys: Record<string, string> = VET_CONFIRM_KEYS): Promise<boolean> {
  const raw = keys[seal.k];
  if (!raw) return false;
  try {
    const pub = await crypto.subtle.importKey("raw", b64urlDecode(raw) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify({ name: "Ed25519" }, pub, b64urlDecode(seal.s) as BufferSource, vetConfirmMessage(seal.v, seal.t, f) as BufferSource);
  } catch {
    return false;
  }
}

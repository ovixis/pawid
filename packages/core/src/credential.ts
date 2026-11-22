// The vet confirmation as a W3C Verifiable Credential (VC Data Model 2.0), signed with a Data
// Integrity proof, cryptosuite eddsa-jcs-2022 (Ed25519 over JCS, RFC 8785). This is the format the
// European Digital Identity Wallet and other verifiers can read. The PawID API issues it with the same
// key that seals vet confirmations; the key is published at did:web:pawid.hospet.eu.
//
// The credential holds only what the vet confirmed (species, microchip, rabies vaccine) and who the
// vet is. Not the pet's name or anything the owner typed alone. Not an official document.
import { b64urlDecode } from "./b64";
import type { VetConfirmation } from "./vetconfirm";

export const PAWID_DID = "did:web:pawid.hospet.eu";

// ---- base58btc (Bitcoin alphabet) and multibase/multikey ----
const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function base58btc(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let out = "";
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of bytes) { if (b !== 0) break; out = "1" + out; }
  return out;
}
export function fromBase58btc(s: string): Uint8Array {
  let n = 0n;
  for (const ch of s) { const i = B58.indexOf(ch); if (i < 0) throw new Error("bad base58"); n = n * 58n + BigInt(i); }
  const bytes: number[] = [];
  while (n > 0n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  for (const ch of s) { if (ch !== "1") break; bytes.unshift(0); }
  return Uint8Array.from(bytes);
}
/** Ed25519 public key (raw, 32 bytes) as a Multikey: "z" + base58btc(0xed 0x01 + key). Starts with z6Mk. */
export const ed25519Multikey = (raw: Uint8Array) => `z${base58btc(Uint8Array.of(0xed, 0x01, ...raw))}`;
export function rawFromMultikey(mk: string): Uint8Array {
  const b = fromBase58btc(mk.slice(1));
  if (mk[0] !== "z" || b[0] !== 0xed || b[1] !== 0x01 || b.length !== 34) throw new Error("not an Ed25519 multikey");
  return b.slice(2);
}

// ---- JCS (RFC 8785) for the JSON we produce: strings, integers, booleans, arrays, objects ----
export function jcs(v: unknown): string {
  if (v === null || typeof v !== "object") {
    if (typeof v === "number" && !Number.isInteger(v)) throw new Error("jcs: only integers are used here");
    return JSON.stringify(v);
  }
  if (Array.isArray(v)) return `[${v.map(jcs).join(",")}]`;
  const o = v as Record<string, unknown>;
  // RFC 8785 sorts by UTF-16 code units, which is what the default sort does.
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${jcs(o[k])}`).join(",")}}`;
}

const sha256 = async (s: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s) as BufferSource));

/** hashData of eddsa-jcs-2022: SHA-256(JCS(proof config)) followed by SHA-256(JCS(document)). */
async function hashData(doc: Record<string, unknown>, proofConfig: Record<string, unknown>): Promise<Uint8Array> {
  const [p, d] = await Promise.all([sha256(jcs(proofConfig)), sha256(jcs(doc))]);
  return Uint8Array.from([...p, ...d]);
}

export interface PetCredentialInput {
  confirmation: VetConfirmation;
  /** The vet as PawID's register has them now (not as the owner's copy says). */
  vet: { name: string; registerBody?: string | null; registerNumber?: string | null; country?: string | null };
  issuer?: string;
}

/** The credential without its proof. */
export function petCredential(i: PetCredentialInput): Record<string, unknown> {
  const f = i.confirmation.fields;
  const at = new Date(i.confirmation.seal.t * 1000).toISOString().replace(/\.\d{3}Z$/, "Z");
  const clean = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, x]) => x !== undefined && x !== null && x !== "")) as T;
  return {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    type: ["VerifiableCredential", "PetVetConfirmation"],
    name: "PawID vet confirmation",
    description: "Microchip and rabies vaccine confirmed by a vet registered with PawID. Not an official document: the EU pet passport, issued by an authorised vet, is.",
    issuer: i.issuer ?? PAWID_DID,
    validFrom: at,
    validUntil: `${f.rabiesValidUntil}T23:59:59Z`,
    credentialSubject: clean({
      type: "Pet",
      species: f.species,
      microchip: f.microchip,
      rabiesVaccination: clean({ administeredOn: f.rabiesGivenOn, validUntil: f.rabiesValidUntil, vaccine: f.rabiesVaccine }),
    }),
    evidence: [clean({
      type: ["VeterinarianConfirmation"],
      confirmedOn: at,
      veterinarian: clean({ name: i.vet.name, registerBody: i.vet.registerBody ?? undefined, registerNumber: i.vet.registerNumber ?? undefined, country: i.vet.country ?? undefined }),
      pawidSeal: { ...i.confirmation.seal },
    })],
  };
}

/** Adds the eddsa-jcs-2022 proof. `kid` is the key's fragment in the issuer's DID document. */
export async function signCredential(doc: Record<string, unknown>, privateKey: CryptoKey, kid: string, created = new Date()): Promise<Record<string, unknown>> {
  const proofConfig = {
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created: created.toISOString().replace(/\.\d{3}Z$/, "Z"),
    verificationMethod: `${doc.issuer as string}#${kid}`,
    proofPurpose: "assertionMethod",
    "@context": doc["@context"],
  };
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "Ed25519" }, privateKey, (await hashData(doc, proofConfig)) as BufferSource));
  // The proof keeps its @context, as the spec's examples and other implementations do.
  return { ...doc, proof: { ...proofConfig, proofValue: `z${base58btc(sig)}` } };
}

/** Checks the proof with the issuer's public keys ({ kid: base64url raw Ed25519 }). */
export async function verifyCredential(vc: Record<string, unknown>, keys: Record<string, string>): Promise<boolean> {
  try {
    const { proof, ...doc } = vc as { proof?: Record<string, unknown> } & Record<string, unknown>;
    if (!proof || proof.type !== "DataIntegrityProof" || proof.cryptosuite !== "eddsa-jcs-2022" || proof.proofPurpose !== "assertionMethod") return false;
    const vm = String(proof.verificationMethod ?? "");
    const [did, kid] = vm.split("#");
    if (did !== doc.issuer || !kid || !keys[kid]) return false;
    const { proofValue, ...rest } = proof;
    if (typeof proofValue !== "string" || proofValue[0] !== "z") return false;
    const pub = await crypto.subtle.importKey("raw", b64urlDecode(keys[kid]!) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
    // A proof @context must match the start of the document's (vc-di-eddsa, Verify Proof).
    const pc = rest["@context"];
    if (pc !== undefined && jcs(pc) !== jcs((doc["@context"] as unknown[]).slice(0, (pc as unknown[]).length))) return false;
    return await crypto.subtle.verify({ name: "Ed25519" }, pub, fromBase58btc(proofValue.slice(1)) as BufferSource, (await hashData(doc, rest)) as BufferSource);
  } catch {
    return false;
  }
}

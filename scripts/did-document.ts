// Writes apps/web/public/.well-known/did.json (did:web) from the issuers in packages/core/src/vetconfirm.ts
// whose did is this site's. Run: npx vite-node scripts/did-document.ts [did:web:your.domain]
import { writeFileSync } from "node:fs";
import { CONFIRM_ISSUERS, b64urlDecode, ed25519Multikey } from "@pawid/core";

const did = process.argv[2] ?? "did:web:pawid.hospet.eu";
const vms = Object.entries(CONFIRM_ISSUERS).filter(([, i]) => i.did === did)
  .map(([kid, i]) => ({ id: `${did}#${kid}`, type: "Multikey", controller: did, publicKeyMultibase: ed25519Multikey(b64urlDecode(i.x)) }));
if (!vms.length) throw new Error(`No issuer with did ${did} in CONFIRM_ISSUERS`);
const out = new URL("../apps/web/public/.well-known/did.json", import.meta.url).pathname;
writeFileSync(out, JSON.stringify({ "@context": ["https://www.w3.org/ns/did/v1", "https://w3id.org/security/multikey/v1"], id: did, verificationMethod: vms, assertionMethod: vms.map((v) => v.id) }, null, 2) + "\n");
console.log(`wrote ${out}`);

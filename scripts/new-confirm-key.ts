// A new Ed25519 confirmation key for your own PawID copy. Run: npx vite-node scripts/new-confirm-key.ts
// Prints the private key (put it in the Worker with `wrangler secret put VET_SIGNING_KEY`, keep a copy
// offline, never commit it) and the public key (goes into CONFIRM_ISSUERS in packages/core/src/vetconfirm.ts).
import { b64urlEncode, ed25519Multikey } from "@pawid/core";

const kp = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"])) as CryptoKeyPair;
const priv = b64urlEncode(new Uint8Array((await crypto.subtle.exportKey("pkcs8", kp.privateKey)) as ArrayBuffer));
const pub = new Uint8Array((await crypto.subtle.exportKey("raw", kp.publicKey)) as ArrayBuffer);
console.log(`Private key (secret VET_SIGNING_KEY, never commit):\n${priv}\n`);
console.log(`Public key (CONFIRM_ISSUERS "x"):\n${b64urlEncode(pub)}\n`);
console.log(`Same public key as a Multikey (did.json):\n${ed25519Multikey(pub)}`);

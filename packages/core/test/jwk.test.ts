import { it, expect } from "vitest";
import { generateOwnerKeys, createShareToken, verifyShareToken } from "../src";
it("keys survive JWK export/import (as the PWA stores them)", async () => {
  const k = await generateOwnerKeys();
  const priv = await crypto.subtle.exportKey("jwk", k.privateKey);
  const pub = await crypto.subtle.exportKey("jwk", k.publicKey);
  const privateKey = await crypto.subtle.importKey("jwk", priv, { name: "Ed25519" }, true, ["sign"]);
  const publicKey = await crypto.subtle.importKey("jwk", pub, { name: "Ed25519" }, true, ["verify"]);
  const now = 1_800_000_000;
  const t = await createShareToken({ name: "Rex", microchip: "380260000123456" }, { privateKey, publicKey }, { nowSec: now });
  expect((await verifyShareToken(t, now + 5)).ok).toBe(true);
});

import { describe, expect, it } from "vitest";
import { exportPairKeys, importPairKeys, isPairPublicKey, newPairKeys, pairDecrypt, pairEncrypt, pairNumber } from "../src";

describe("vet and owner pairing", () => {
  it("both phones compute the same number, and a third key changes it", async () => {
    const owner = await newPairKeys();
    const vet = await newPairKeys();
    const evil = await newPairKeys();
    expect(isPairPublicKey(owner.publicRaw)).toBe(true);
    const n = await pairNumber("482913", owner.publicRaw, vet.publicRaw);
    expect(n).toMatch(/^\d{2}$/);
    expect(await pairNumber("482913", owner.publicRaw, vet.publicRaw)).toBe(n);
    const others = await Promise.all(Array.from({ length: 8 }, async () => pairNumber("482913", owner.publicRaw, (await newPairKeys()).publicRaw)));
    expect(others.some((x) => x !== n)).toBe(true);
    void evil;
  });
  it("only the two phones can read what they send", async () => {
    const owner = await newPairKeys();
    const vet = await newPairKeys();
    const ct = await pairEncrypt(vet, owner.publicRaw, "482913", { hello: "owner" });
    expect(await pairDecrypt(owner, vet.publicRaw, "482913", ct)).toEqual({ hello: "owner" });
    const stranger = await newPairKeys();
    await expect(pairDecrypt(stranger, vet.publicRaw, "482913", ct)).rejects.toThrow();
    await expect(pairDecrypt(owner, vet.publicRaw, "000000", ct)).rejects.toThrow();
  });
  it("keys survive a page reload", async () => {
    const owner = await newPairKeys();
    const back = await importPairKeys(await exportPairKeys(owner));
    expect(back.publicRaw).toBe(owner.publicRaw);
    const vet = await newPairKeys();
    const ct = await pairEncrypt(vet, owner.publicRaw, "111111", [1]);
    expect(await pairDecrypt(back, vet.publicRaw, "111111", ct)).toEqual([1]);
  });
});

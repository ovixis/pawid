import { describe, expect, it } from "vitest";
import { createShareToken, generateOwnerKeys } from "@pawid/core";
import { app, esc } from "../src/index";

const nowSec = () => Math.floor(Date.now() / 1000);

describe("api", () => {
  it("health", async () => {
    const res = await app.request("/health");
    expect(await res.json()).toEqual({ ok: true });
  });

  it("verifies a good token and shows the self declared warning", async () => {
    const keys = await generateOwnerKeys();
    const token = await createShareToken(
      { name: "Rex", microchip: "380260000123456", rabiesValidUntil: "2026-12-01" },
      keys,
      { nowSec: nowSec() },
    );
    const res = await app.request(`/v/${token}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Rex");
    expect(html).toContain("Not verified by a vet");
    expect(html).toMatch(/PawID by<\/span><a href="https:\/\/hospet\.eu"[^>]*><svg[^]*?aria-hidden="true"[^]*?<\/svg>HosPet\.eu<\/a>/);
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
  });

  it("escapes html in the dog name (a forged token must not run scripts)", async () => {
    const keys = await generateOwnerKeys();
    const token = await createShareToken(
      { name: "<script>alert(1)</script>", microchip: "380260000123456" },
      keys,
      { nowSec: nowSec() },
    );
    const html = await (await app.request(`/v/${token}`)).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(esc("<b>")).toBe("&#60;b&#62;");
  });

  it("rejects garbage with 400", async () => {
    const res = await app.request("/api/verify?token=nope");
    expect(res.status).toBe(400);
  });
});

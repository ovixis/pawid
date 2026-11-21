import { describe, expect, it } from "vitest";
import { COUNTRIES, EU_BASE, isOfficialSource, rulesFor } from "../src";

const all = [...EU_BASE.rules.map((r) => ({ where: "eu-base", r })), ...COUNTRIES.flatMap((c) => c.overrides.map((r) => ({ where: c.country, r })))];

describe("rules data", () => {
  it.each(all.map((x) => [`${x.where}/${x.r.id}`, x.r] as const))("%s cites only official sources", (_, rule) => {
    for (const s of rule.sources) expect(isOfficialSource(s), s).toBe(true);
  });
  it.each(all.map((x) => [`${x.where}/${x.r.id}`, x.r] as const))("%s: needs_review rules say what is missing", (_, rule) => {
    if (rule.status === "needs_review") expect(rule.todo, "add a todo").toBeTruthy();
  });
  it("country official pages are official hosts", () => {
    for (const c of COUNTRIES) for (const p of c.official_pages) expect(isOfficialSource(p), `${c.country}: ${p}`).toBe(true);
  });
  it("rule ids are unique in the EU base", () => {
    const ids = EU_BASE.rules.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("source check rejects look-alikes and plain http", () => {
    expect(isOfficialSource("https://food.ec.europa.eu/x")).toBe(true);
    expect(isOfficialSource("https://europa.eu.evil.com/x")).toBe(false);
    expect(isOfficialSource("http://europa.eu/x")).toBe(false);
  });
  it("a country with no file gets the EU base and says so", () => {
    const r = rulesFor("PT");
    expect(r.countryCovered).toBe(false);
    expect(r.rules.length).toBe(EU_BASE.rules.length);
  });
});

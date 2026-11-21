import { describe, expect, it } from "vitest";
import { esc, petCardHtml, rabiesState } from "../src";

describe("pet card html", () => {
  it("escapes every user value", () => {
    const html = petCardHtml(
      { name: "<img src=x onerror=alert(1)>", breed: '"><script>x</script>', notes: "<b>hi</b>", vetPhone: '+39"><svg onload=1>', owner: "<i>A</i>" },
      { todayIso: "2026-11-21" },
    );
    expect(html).not.toMatch(/<img src=x|<script>|<b>hi|<svg onload|<i>A/);
    expect(html).toContain("&#60;img src=x");
  });
  it("always carries the owner-declared footer", () => {
    expect(petCardHtml({ name: "Rex" }, { todayIso: "2026-11-21" })).toContain("Not verified by a vet");
  });
  it("hides empty sections for venues", () => {
    const html = petCardHtml({ name: "Rex", microchip: "380260000123456" }, { todayIso: "2026-11-21", hideEmpty: true });
    expect(html).toContain("Identification");
    expect(html).not.toContain("Rabies vaccine");
    expect(html).not.toContain(">Vet<");
    expect(html).not.toContain("Not given");
  });
  it("rabies state", () => {
    expect(rabiesState("2026-12-30", "2026-11-21")).toBe("valid");
    expect(rabiesState("2026-12-01", "2026-11-21")).toBe("soon");
    expect(rabiesState("2026-11-20", "2026-11-21")).toBe("expired");
    expect(esc(`a&"'`)).toBe("a&#38;&#34;&#39;");
  });
});

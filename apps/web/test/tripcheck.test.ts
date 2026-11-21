import { describe, expect, it } from "vitest";
import type { Pet } from "@pawid/core";
import { EU_BASE, rulesFor } from "@pawid/rules";
import { RULES_USED, checkTrip } from "../src/tripcheck";

const pet = (o: Partial<Pet> = {}): Pet => ({ id: "x", species: "dog", name: "Rex", microchip: "380260000123456", vaccinations: [{ kind: "rabies", administeredOn: "2026-01-10", validUntil: "2029-01-10" }], treatments: [], ...o } as Pet);

describe("trip check", () => {
  it("every rule it relies on exists and is verified", () => {
    for (const id of RULES_USED.eu) expect(EU_BASE.rules.find((r) => r.id === id)?.status, id).toBe("verified");
    for (const [c, ids] of Object.entries(RULES_USED)) {
      if (c === "eu") continue;
      for (const id of ids) expect(rulesFor(c).rules.find((r) => r.id === id && r.scope === "country")?.status, `${c}/${id}`).toBe("verified");
    }
  });
  it("blocks a missing microchip and an expired vaccine", () => {
    const c = checkTrip(pet({ microchip: undefined, vaccinations: [{ kind: "rabies", administeredOn: "2025-01-01", validUntil: "2026-01-01" }] }), "FR", "2026-12-01");
    expect(c.filter((x) => x.state === "no").map((x) => x.rule)).toEqual(["microchip", "waiting_period_after_primary_vaccination"]);
  });
  it("warns inside the 21 days after a first vaccination, not after a booster in time", () => {
    expect(checkTrip(pet(), "IT", "2026-01-20").find((x) => x.rule === "waiting_period_after_primary_vaccination")?.state).toBe("warn");
    expect(checkTrip(pet(), "IT", "2026-01-31").find((x) => x.title === "Rabies vaccine valid")?.state).toBe("ok");
    expect(checkTrip(pet({ boosterInTime: true }), "IT", "2026-01-20").find((x) => x.title === "Rabies vaccine valid")?.state).toBe("ok");
  });
  it("asks dogs going to Ireland for the tapeworm treatment, not cats", () => {
    const d = checkTrip(pet(), "IE", "2026-06-10").find((x) => x.rule === "echinococcus_treatment");
    expect(d?.state).toBe("todo");
    expect(d?.text).toContain("5 June 2026");
    expect(checkTrip(pet({ species: "cat" }), "IE", "2026-06-10").find((x) => x.rule === "echinococcus_treatment")?.state).toBe("ok");
    expect(checkTrip(pet(), "FR", "2026-06-10").some((x) => x.rule === "echinococcus_treatment")).toBe(false);
  });
  it("flags banned breeds in Germany only for the named breeds", () => {
    expect(checkTrip(pet({ breed: "American Staffordshire Terrier" }), "DE", "2026-06-10").some((x) => x.rule === "banned_breeds" && x.state === "no")).toBe(true);
    expect(checkTrip(pet({ breed: "Border Collie" }), "DE", "2026-06-10").some((x) => x.rule === "banned_breeds")).toBe(false);
    expect(checkTrip(pet({ breed: "Staffordshire Bull Terrier" }), "IT", "2026-06-10").some((x) => x.rule === "banned_breeds")).toBe(false);
  });
});

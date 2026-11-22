import { describe, expect, it } from "vitest";
import { VACCINES, addMonths, vaccinePlan } from "../src/vaccines";
import { isOfficialSource } from "../src/index";

describe("vaccine data", () => {
  it("parses and every source is https", () => {
    for (const s of Object.values(VACCINES.sources)) expect(s.url.startsWith("https://")).toBe(true);
    expect(VACCINES.countries.map((c) => c.country).sort()).toEqual(["DE", "ES", "FR", "IE", "IT"]);
  });
  it("Spain lists 19 regions with 17 required for dogs", () => {
    const es = VACCINES.countries.find((c) => c.country === "ES")!;
    expect(es.regions!.length).toBe(19);
    expect(es.regions!.filter((r) => r.dog === "required").length).toBe(17);
  });
  it("adds months at month ends", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
  });
});

describe("vaccinePlan", () => {
  const base = { birthDate: "2026-10-01", today: "2026-11-22" } as const;
  it("dog in Germany: StIKo Vet at 8, 12, 16 weeks and 15 months", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "DE" });
    const core = p.items.filter((i) => i.group === "core");
    expect(core.map((i) => i.from)).toEqual(["2026-11-26", "2026-12-24", "2027-01-21", "2028-01-01"]);
    expect(p.schedule.foreign).toBe(false);
    expect(core[0]!.when).toBe("next");
    const lepto = p.items.find((i) => i.key.endsWith("lepto_yearly"))!;
    expect(lepto.from).toBe("2029-01-01");
  });
  it("dog in Italy uses the German schedule and says why", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "IT" });
    expect(p.schedule.foreign).toBe(true);
    expect(p.schedule.why).toMatch(/Italian/);
  });
  it("cat in France: ABCD, low risk boosters every 3 years by default", () => {
    const p = vaccinePlan({ ...base, species: "cat", country: "FR" });
    expect(p.schedule.id).toBe("cat_abcd");
    expect(p.schedule.foreign).toBe(false);
    expect(p.items.find((i) => i.key.endsWith("kitten_8w"))).toMatchObject({ from: "2026-11-26", to: "2026-12-03" });
    expect(p.items.some((i) => i.key.endsWith("flu_low"))).toBe(true);
    expect(p.items.some((i) => i.key.endsWith("flu_high"))).toBe(false);
    expect(vaccinePlan({ ...base, species: "cat", country: "FR", highRisk: true }).items.some((i) => i.key.endsWith("flu_high"))).toBe(true);
    // The dangerous dog law is for dogs only.
    expect(p.items.some((i) => i.group === "law")).toBe(false);
  });
  it("Spain, Navarra: rabies by law from 12 weeks, before 28", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "ES", region: "NC" });
    const law = p.items.find((i) => i.key === "ES.NC")!;
    expect(law).toMatchObject({ from: "2026-12-24", to: "2027-04-14" });
    expect(law.text).toMatch(/within a month/);
  });
  it("Spain, Murcia (unclear age): no date", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "ES", region: "MC" });
    expect(p.items.find((i) => i.key === "ES.MC")).toMatchObject({ when: "nodate" });
  });
  it("Spain, Madrid annual law beats a 3 year vaccine", () => {
    const p = vaccinePlan({ species: "dog", birthDate: "2022-01-01", today: "2026-11-22", country: "ES", region: "MD", vaccinations: [{ kind: "rabies", administeredOn: "2026-03-01", validUntil: "2029-03-01" }] });
    expect(p.items.find((i) => i.key === "ES.MD.booster")!.from).toBe("2027-03-01");
  });
  it("Cataluña: voluntary, a note and no law item", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "ES", region: "CT" });
    expect(p.items.some((i) => i.group === "law")).toBe(false);
    expect(p.notes[0]!.text).toMatch(/voluntary/);
  });
  it("adult dog: the puppy course is past and the next lepto booster is ahead", () => {
    const p = vaccinePlan({ species: "dog", birthDate: "2020-05-10", today: "2026-11-22", country: "DE" });
    expect(p.items.filter((i) => i.group === "core").every((i) => i.when === "past")).toBe(true);
    const lepto = p.items.find((i) => i.key.endsWith("lepto_yearly"))!;
    expect((lepto.from ?? "") >= "2026-11-22").toBe(true);
  });
  it("outdoor cat: FeLV first", () => {
    const p = vaccinePlan({ ...base, species: "cat", country: "IE", outdoor: true });
    expect(p.optional[0]).toMatchObject({ forYou: true });
    expect(p.optional[0]!.vaccine).toMatch(/FeLV/);
  });
  it("marks passport entries near a dose", () => {
    const p = vaccinePlan({ ...base, species: "dog", country: "DE", vaccinations: [{ kind: "other", administeredOn: "2026-11-27", validUntil: "2027-11-27" }] });
    expect(p.items.find((i) => i.key.endsWith("puppy_8w"))!.inPassport).toBe("2026-11-27");
  });
  it("government sources in the data are on official hosts where PawID lists them", () => {
    expect(isOfficialSource(VACCINES.travel.source ? VACCINES.sources[VACCINES.travel.source]!.url : "")).toBe(true);
  });
});

describe("boosters from the passport", () => {
  it("counts the cat's next booster from the last vaccination in the passport", () => {
    const p = vaccinePlan({ species: "cat", birthDate: "2021-03-15", today: "2026-11-22", country: "IT", vaccinations: [{ kind: "other", administeredOn: "2025-02-10", validUntil: "2028-02-10" }] });
    const b = p.items.find((i) => i.key.endsWith("fpv_3y"))!;
    expect(b).toMatchObject({ from: "2028-02-10", countedFrom: "2025-02-10" });
  });
});

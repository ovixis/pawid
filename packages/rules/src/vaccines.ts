// Vaccination timeline from a pet's birth date, built only from rules/vaccines.yaml.
// It shows the typical schedule of a named European source. The vet decides; the passport is the record.
import { z } from "zod";
import { RAW } from "./data.generated";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const status = z.enum(["verified", "needs_review"]);
type AgeT = { w?: number; m?: number; to?: AgeT };
const age: z.ZodType<AgeT> = z.lazy(() =>
  z.object({ w: z.number().int().positive().optional(), m: z.number().int().positive().optional(), to: age.optional() })
    .refine((a) => (a.w === undefined) !== (a.m === undefined), "an age has either w (weeks) or m (months)"),
);

const sourceSchema = z.object({ name: z.string(), url: z.string().url(), page: z.string().url().optional(), scope: z.string(), todo: z.string().optional() });
const doseSchema = z.object({ id: z.string(), label: z.string(), at: age, core: z.array(z.string()).min(1), text: z.string().optional(), quote: z.string() });
const boosterSchema = z.object({ id: z.string(), after: z.string(), core: z.array(z.string()).min(1), every: age, risk: z.enum(["low", "high"]).optional(), text: z.string().optional(), quote: z.string() });
const optionalSchema = z.object({ id: z.string(), vaccine: z.string(), from: age.optional(), risk: z.literal("outdoor").optional(), when: z.string(), quote: z.string() });
const scheduleSchema = z.object({ id: z.string(), species: z.enum(["dog", "cat"]), source: z.string(), status, doses: z.array(doseSchema).min(1), boosters: z.array(boosterSchema), optional: z.array(optionalSchema) });
const noteSchema = z.object({ text: z.string(), source: z.string(), status, todo: z.string().optional(), quote: z.string().optional(), evidence: z.string().optional() })
  .refine((n) => n.quote || n.evidence, "a note needs a quote or evidence");
const lawSchema = z.object({ id: z.string(), species: z.array(z.enum(["dog", "cat"])), condition: z.string().optional(), text: z.string(), from: age.optional(), booster: z.literal("passport"), source: z.string(), status, quote: z.string() });
const rule = z.enum(["required", "recommended", "voluntary", "travel"]);
const regionSchema = z.object({
  id: z.string().regex(/^[A-Z]{2}$/), name: z.string(), dog: rule, cat: rule,
  from: age.optional(), before: age.optional(),
  second_dose_days: z.number().int().positive().optional(), second_dose_within_days: z.number().int().positive().optional(),
  first_booster_months: z.number().int().positive().optional(),
  booster: z.enum(["annual", "biennial", "product", "annual_or_product"]).optional(),
  status, source_url: z.string().url(), law_url: z.string().url().optional(), quote: z.string().optional(), evidence: z.string().optional(), todo: z.string().optional(),
}).refine((r) => r.quote || r.evidence, "a region needs a quote or evidence")
  .refine((r) => r.status === "needs_review" || r.dog !== "required" || r.from, "a verified required rule needs a minimum age");
const countrySchema = z.object({
  country: z.string().regex(/^[A-Z]{2}$/), name: z.string(),
  schedule: z.object({ dog: z.string(), cat: z.string() }),
  no_national_schedule: z.string().optional(), no_national_schedule_source: z.string().optional(),
  notes: z.array(noteSchema).default([]), laws: z.array(lawSchema).default([]), regions: z.array(regionSchema).optional(),
});
export const vaccinesSchema = z.object({
  last_checked: date,
  sources: z.record(z.string(), sourceSchema),
  schedules: z.array(scheduleSchema),
  travel: z.object({ source: z.string(), status, first_dose_from: age, wait_days: z.number().int().positive(), text: z.string(), quote: z.string() }),
  countries: z.array(countrySchema),
}).superRefine((v, ctx) => {
  const has = (id: string, where: string) => { if (!v.sources[id]) ctx.addIssue({ code: "custom", message: `unknown source ${id} in ${where}` }); };
  const sched = new Set(v.schedules.map((s) => s.id));
  for (const s of v.schedules) {
    has(s.source, s.id);
    for (const b of s.boosters) if (!s.doses.some((d) => d.id === b.after)) ctx.addIssue({ code: "custom", message: `${s.id}.${b.id}: unknown dose ${b.after}` });
  }
  has(v.travel.source, "travel");
  for (const c of v.countries) {
    for (const sp of ["dog", "cat"] as const) {
      const id = c.schedule[sp];
      if (!sched.has(id) || v.schedules.find((s) => s.id === id)!.species !== sp) ctx.addIssue({ code: "custom", message: `${c.country}: bad ${sp} schedule ${id}` });
    }
    c.notes.forEach((n) => has(n.source, c.country));
    c.laws.forEach((l) => has(l.source, c.country));
    if (c.no_national_schedule_source) has(c.no_national_schedule_source, c.country);
  }
});

export type VaccineData = z.infer<typeof vaccinesSchema>;
export const VACCINES: VaccineData = vaccinesSchema.parse((RAW as unknown as { vaccines: unknown }).vaccines);

// ---- dates (UTC, ISO yyyy-mm-dd) ----
const DAY = 86_400_000;
const toD = (iso: string) => new Date(`${iso}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(s: string, n: number): string { return iso(new Date(toD(s).getTime() + n * DAY)); }
/** Adds calendar months; the 31st becomes the last day of a shorter month. */
export function addMonths(s: string, n: number): string {
  const d = toD(s);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return iso(new Date(Date.UTC(y, m, Math.min(day, last))));
}
const plus = (s: string, a: AgeT) => (a.w !== undefined ? addDays(s, a.w * 7) : addMonths(s, a.m!));
const ageText = (a: AgeT): string => {
  const one = (x: AgeT) => (x.w !== undefined ? `${x.w} weeks` : `${x.m} months`);
  if (!a.to) return one(a);
  return a.w !== undefined && a.to.w !== undefined ? `${a.w} to ${a.to.w} weeks` : a.m !== undefined && a.to.m !== undefined ? `${a.m} to ${a.to.m} months` : `${one(a)} to ${one(a.to)}`;
};
const everyText = (a: AgeT): string => {
  if (a.m === 12 && !a.to) return "every year";
  if (a.m && a.m % 12 === 0 && !a.to) return `every ${a.m / 12} years`;
  if (a.m === 12 && a.to?.m === 36) return "every 1 to 3 years";
  return `every ${ageText(a)}`;
};

// ---- the plan ----
export interface Src { name: string; url: string; lastChecked: string; status: "verified" | "needs_review"; quote?: string; todo?: string }
export type Group = "core" | "booster" | "law" | "travel";
export type When = "past" | "now" | "next" | "later" | "nodate";
export interface PlanItem {
  key: string;
  group: Group;
  label: string;
  vaccines: string[];
  /** Typical age, as text ("8 weeks"). */
  age?: string;
  from?: string;
  to?: string;
  text?: string;
  when: When;
  /** Booster counted from this passport vaccination instead of the end of the course. */
  countedFrom?: string;
  /** A vaccination in the passport near this date (the owner typed it in). */
  inPassport?: string;
  src: Src;
}
export interface OptionalVaccine { key: string; vaccine: string; when: string; from?: string; age?: string; forYou: boolean; src: Src }
export interface PlanNote { text: string; src: Src }
export interface VaccinePlan {
  species: "dog" | "cat";
  country: string | null;
  countryName: string | null;
  /** Source of the typical schedule, and whether it comes from another country. */
  schedule: { id: string; name: string; scope: string; url: string; foreign: boolean; why?: string };
  items: PlanItem[];
  optional: OptionalVaccine[];
  notes: PlanNote[];
  regions: { id: string; name: string }[];
  region: { id: string; name: string } | null;
  lastChecked: string;
  disclaimer: string;
}
export interface PlanInput {
  species: "dog" | "cat";
  birthDate: string;
  today: string;
  country?: string | null;
  region?: string | null;
  /** Cat goes outside / meets cats of unknown FeLV status. */
  outdoor?: boolean;
  /** Cat at high risk: shelter, many cats at home, breeding or boarding cattery. */
  highRisk?: boolean;
  vaccinations?: { kind: "rabies" | "other"; administeredOn: string; validUntil: string }[];
}

export const VACCINE_DISCLAIMER =
  "The typical schedule from the source named, not advice for your pet. Your vet decides which vaccines and when, and writes them in the passport. Vaccines differ: the leaflet of the one used sets the booster.";

export function vaccinePlan(input: PlanInput): VaccinePlan {
  const V = VACCINES;
  const src = (id: string, status: Src["status"], quote?: string, todo?: string): Src => {
    const s = V.sources[id]!;
    return { name: s.name, url: s.url, lastChecked: V.last_checked, status, quote, todo: todo ?? s.todo };
  };
  const code = input.country ? input.country.toUpperCase() : null;
  const c = code ? V.countries.find((x) => x.country === code) : undefined;
  const schedId = c?.schedule[input.species] ?? (input.species === "dog" ? "dog_stiko" : "cat_abcd");
  const sched = V.schedules.find((s) => s.id === schedId)!;
  const sSrc = V.sources[sched.source]!;
  const foreign = Boolean(c) ? sSrc.scope !== "Europe" && sSrc.scope !== c!.name : sSrc.scope !== "Europe";
  const birth = input.birthDate;
  const vacc = input.vaccinations ?? [];
  const near = (kind: "rabies" | "other", from: string, to: string) =>
    vacc.filter((v) => v.kind === kind && v.administeredOn >= addDays(from, -21) && v.administeredOn <= addDays(to, 42)).map((v) => v.administeredOn).sort()[0];

  const items: Omit<PlanItem, "when">[] = [];
  const doseDate = new Map<string, string>();
  for (const d of sched.doses) {
    const from = plus(birth, d.at);
    const to = d.at.to ? plus(birth, d.at.to) : from;
    doseDate.set(d.id, to);
    items.push({ key: `${sched.id}.${d.id}`, group: "core", label: d.label, vaccines: d.core, age: ageText(d.at), from, to, text: d.text, inPassport: near("other", from, to), src: src(sched.source, sched.status, d.quote) });
  }
  for (const b of sched.boosters) {
    if (b.risk === "high" && !input.highRisk) continue;
    if (b.risk === "low" && input.highRisk) continue;
    // Count from the last vaccination in the passport after the course, if there is one.
    const course = doseDate.get(b.after)!;
    const lastOther = vacc.filter((v) => v.kind === "other" && v.administeredOn >= addDays(course, -42)).map((v) => v.administeredOn).sort().pop();
    const anchor = lastOther && lastOther > course ? lastOther : course;
    let from = plus(anchor, b.every);
    let to = b.every.to ? plus(anchor, b.every.to) : from;
    let n = 1;
    // Fixed intervals repeat: show the next one that is not over yet.
    if (!b.every.to) while (to < input.today && n < 40) { from = plus(from, b.every); to = from; n++; }
    items.push({ key: `${sched.id}.${b.id}`, group: "booster", label: n === 1 ? "First booster" : "Next booster", vaccines: b.core, age: undefined, from, to, text: b.text ?? `Then ${everyText(b.every)}.`, countedFrom: anchor === lastOther ? anchor : undefined, inPassport: near("other", from, to), src: src(sched.source, sched.status, b.quote) });
  }

  // Rabies: the law where the pet lives, then travel.
  const rabies = vacc.filter((v) => v.kind === "rabies").sort((a, b) => a.administeredOn.localeCompare(b.administeredOn));
  const lastRabies = rabies[rabies.length - 1];
  const notes: PlanNote[] = (c?.notes ?? []).map((n) => ({ text: n.text, src: src(n.source, n.status, n.quote, n.todo) }));
  const regions = (c?.regions ?? []).map((r) => ({ id: r.id, name: r.name }));
  const region = c?.regions?.find((r) => r.id === (input.region ?? "").toUpperCase()) ?? null;
  for (const l of c?.laws ?? []) {
    if (!l.species.includes(input.species)) continue;
    const from = l.from ? plus(birth, l.from) : undefined;
    items.push({ key: l.id, group: "law", label: `Rabies, required by law${l.condition ? ` (${l.condition.replace(/^If /, "if ")})` : ""}`, vaccines: ["rabies"], age: l.from ? `from ${ageText(l.from)}` : undefined, from, to: from, text: l.text, inPassport: rabies[0]?.administeredOn, src: src(l.source, l.status, l.quote) });
  }
  if (region) {
    const rule = region[input.species];
    const rSrc: Src = { name: `${region.name}: regional rabies rule`, url: region.law_url ?? region.source_url, lastChecked: V.last_checked, status: region.status, quote: region.quote ?? region.evidence, todo: region.todo };
    if (region.law_url) rSrc.name += " (quoted in the Spanish Ministry of Agriculture's 2023 rabies plan)";
    if (rule === "required") {
      const from = region.from && region.status === "verified" ? plus(birth, region.from) : undefined;
      const to = region.before && from ? addDays(plus(birth, region.before), -1) : from;
      const bText: Record<string, string> = {
        annual: "Then every year, even if the vaccine lasts longer.",
        biennial: "Then every 2 years.",
        product: "Then before the date the vet writes in the passport.",
        annual_or_product: "Then every year, or before the date in the passport if that comes first.",
      };
      const parts = [
        region.second_dose_days ? `A second dose ${region.second_dose_days} days after the first.` : "",
        region.second_dose_within_days ? "A second dose within a month of the first." : "",
        region.first_booster_months ? `A booster ${region.first_booster_months} months after the first dose.` : "",
        region.booster ? bText[region.booster]! : "",
        !from ? "PawID shows no date: the rule is not clear yet. Ask your vet." : "",
      ].filter(Boolean);
      items.push({ key: `ES.${region.id}`, group: "law", label: `Rabies, required by law in ${region.name}`, vaccines: ["rabies"], age: region.from ? `from ${ageText(region.from)}${region.before ? `, before ${ageText(region.before)}` : ""}` : undefined, from, to, text: parts.join(" "), inPassport: rabies[0]?.administeredOn, src: rSrc });
      if (lastRabies && region.booster) {
        const byLaw = region.booster === "annual" || region.booster === "annual_or_product" ? addMonths(lastRabies.administeredOn, 12) : region.booster === "biennial" ? addMonths(lastRabies.administeredOn, 24) : lastRabies.validUntil;
        const due = byLaw < lastRabies.validUntil ? byLaw : lastRabies.validUntil;
        items.push({ key: `ES.${region.id}.booster`, group: "law", label: `Rabies booster, by law in ${region.name}`, vaccines: ["rabies"], from: due, to: due, text: due < lastRabies.validUntil ? `By ${due}: the law asks for it sooner than the passport date (${lastRabies.validUntil}).` : "By the date the vet wrote in the passport.", src: rSrc });
      }
    } else {
      const say = { recommended: "recommended, not required", voluntary: "voluntary", travel: "required only to travel to or from the region" }[rule];
      notes.unshift({ text: `${region.name}: rabies vaccination of ${input.species === "dog" ? "dogs" : "cats"} is ${say}. It is still needed to travel.`, src: rSrc });
    }
  }
  const t = V.travel;
  const tFrom = plus(birth, t.first_dose_from);
  if (lastRabies) {
    const first = rabies[0]!;
    items.push({ key: "travel.booster", group: "travel", label: "Rabies booster, to keep travelling", vaccines: ["rabies"], from: lastRabies.validUntil, to: lastRabies.validUntil, text: "Before the date the vet wrote in the passport. A late booster counts as a new first vaccination, with 21 days to wait again.", src: src(t.source, t.status, t.quote) });
    if (addDays(first.administeredOn, t.wait_days) >= input.today) items.push({ key: "travel.ready", group: "travel", label: "Can travel to other EU countries", vaccines: [], from: addDays(first.administeredOn, t.wait_days), to: addDays(first.administeredOn, t.wait_days), text: `${t.wait_days} days after the first rabies vaccination.`, src: src(t.source, t.status, t.quote) });
  } else {
    items.push({ key: "travel.rabies", group: "travel", label: "Rabies, to travel", vaccines: ["rabies"], age: `from ${ageText(t.first_dose_from)}`, from: tFrom, to: tFrom, text: `Only if you plan to travel to another country. Travel from ${t.wait_days} days after the vaccination. The microchip must come first.`, src: src(t.source, t.status, t.quote) });
  }

  // Order by date, then place each one in time.
  items.sort((a, b) => (a.from ?? "9999").localeCompare(b.from ?? "9999"));
  let nextSet = false;
  const placed: PlanItem[] = items.map((it) => {
    let when: When;
    if (!it.from) when = "nodate";
    else if ((it.to ?? it.from) < input.today) when = "past";
    else if (it.from <= input.today) when = "now";
    else if (!nextSet) { when = "next"; }
    else when = "later";
    if (when === "now" || when === "next") nextSet = true;
    return { ...it, when };
  });

  const optional: OptionalVaccine[] = sched.optional
    .filter((o) => o.id !== "rabies")
    .map((o) => ({ key: `${sched.id}.${o.id}`, vaccine: o.vaccine, when: o.when, from: o.from ? plus(birth, o.from) : undefined, age: o.from ? `from ${ageText(o.from)}` : undefined, forYou: o.risk === "outdoor" && Boolean(input.outdoor), src: src(sched.source, sched.status, o.quote) }))
    .sort((a, b) => Number(b.forYou) - Number(a.forYou));

  let why: string | undefined;
  if (foreign) why = c?.no_national_schedule ?? `PawID has no schedule from ${c?.name ?? "your country"} yet.`;
  return {
    species: input.species,
    country: code,
    countryName: c?.name ?? null,
    schedule: { id: sched.id, name: sSrc.name, scope: sSrc.scope, url: sSrc.url, foreign, why },
    items: placed,
    optional,
    notes,
    regions,
    region: region ? { id: region.id, name: region.name } : null,
    lastChecked: V.last_checked,
    disclaimer: VACCINE_DISCLAIMER,
  };
}

export const vaccineCountries = () => VACCINES.countries.map((c) => ({ country: c.country, name: c.name }));

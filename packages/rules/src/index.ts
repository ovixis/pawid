import { z } from "zod";
import { RAW } from "./data.generated";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ruleSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/),
  text: z.string().min(1),
  /** verified = checked against the cited official page on last_checked. needs_review = a human must check before use. */
  status: z.enum(["verified", "needs_review"]),
  todo: z.string().optional(),
  sources: z.array(z.string().url()).min(1),
});

export const euBaseSchema = z.object({
  id: z.literal("eu-base"),
  scope: z.string(),
  applies_to: z.string(),
  last_checked: date,
  rules: z.array(ruleSchema),
});

export const countrySchema = z.object({
  country: z.string().regex(/^[A-Z]{2}$/),
  name: z.string(),
  official_pages: z.array(z.string().url()).min(1),
  last_checked: date,
  checked_by: z.string(),
  overrides: z.array(ruleSchema),
});

export type Rule = z.infer<typeof ruleSchema>;
export type CountryRules = z.infer<typeof countrySchema>;

const yamlDate = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v);
const norm = <T extends Record<string, unknown>>(o: T) => ({ ...o, last_checked: yamlDate(o.last_checked) });

export const EU_BASE = euBaseSchema.parse(norm(RAW.euBase as Record<string, unknown>));
export const COUNTRIES: CountryRules[] = (RAW.countries as unknown as Record<string, unknown>[]).map((c) => countrySchema.parse(norm(c)));
const hosts = RAW.officialHosts as unknown as { eu?: string[]; national?: string[] };
export const OFFICIAL_HOSTS: string[] = [...(hosts.eu ?? []), ...(hosts.national ?? [])];

export function isOfficialSource(url: string): boolean {
  let host: string;
  try { host = new URL(url).hostname.toLowerCase(); } catch { return false; }
  if (!url.startsWith("https://")) return false;
  return OFFICIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export interface RulesFor {
  country: string | null;
  countryName: string | null;
  /** false when PawID has no file for this country yet: only the EU base applies here. */
  countryCovered: boolean;
  lastChecked: string;
  rules: (Rule & { scope: "eu" | "country"; lastChecked: string })[];
  disclaimer: string;
}

export const DISCLAIMER =
  "Not legal advice and not official. Rules change. Rules still being checked are not confirmed: check the official source before travelling.";

/** EU base rules, with a country's overrides replacing the base rule of the same id. */
export function rulesFor(country?: string | null): RulesFor {
  const code = country ? country.toUpperCase() : null;
  const c = code ? COUNTRIES.find((x) => x.country === code) : undefined;
  const over = new Map((c?.overrides ?? []).map((r) => [r.id, r]));
  const rules = [
    ...EU_BASE.rules.map((r) => (over.has(r.id) ? { ...over.get(r.id)!, scope: "country" as const, lastChecked: c!.last_checked } : { ...r, scope: "eu" as const, lastChecked: EU_BASE.last_checked })),
    ...(c?.overrides ?? []).filter((r) => !EU_BASE.rules.some((b) => b.id === r.id)).map((r) => ({ ...r, scope: "country" as const, lastChecked: c!.last_checked })),
  ];
  return { country: code, countryName: c?.name ?? null, countryCovered: Boolean(c), lastChecked: c?.last_checked ?? EU_BASE.last_checked, rules, disclaimer: DISCLAIMER };
}

export const coveredCountries = () => COUNTRIES.map((c) => ({ country: c.country, name: c.name, lastChecked: c.last_checked }));
export * from "./vaccines";

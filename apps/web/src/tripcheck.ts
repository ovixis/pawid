// "Can I travel?": checks one pet against the rules of one country on one date.
// Every number and list here comes from a rule in rules/ (the rule id is next to it), and each result
// links to that rule. tripcheck.test.ts fails if one of those rules is missing or not verified.
import type { Pet } from "@pawid/core";
import { rulesFor } from "@pawid/rules";
import { longDate } from "@pawid/ui";

const d = (iso: string) => longDate(iso) ?? iso;

export type State = "ok" | "warn" | "no" | "todo";
export interface Check { state: State; title: string; text: string; rule?: string }

/** eu-base/waiting_period_after_primary_vaccination */
export const WAIT_DAYS = 21;
/** eu-base/echinococcus_treatment: dogs only, given 24 to 120 hours before entry. */
export const TAPEWORM_COUNTRIES = ["FI", "IE", "MT", "NO"];
/** The rules each check relies on, per country where it matters. */
export const RULES_USED = {
  eu: ["microchip", "rabies_vaccination", "waiting_period_after_primary_vaccination", "echinococcus_treatment", "young_animals", "passport"],
  DE: ["banned_breeds", "banned_breeds_short_stay"],
  FR: ["dangerous_dogs_category_1", "dangerous_dogs_category_2", "dog_type_attestation"],
  ES: ["potentially_dangerous_dogs"],
  IE: ["xl_bully_ban", "echinococcus_treatment"],
} as const;

const DAY = 86_400_000;
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const has = (breed: string, ...words: string[]) => words.some((w) => breed.includes(w));

/** Breed names that one of the country rules names. Matching is by words: the result says "may", never "is". */
function breedChecks(pet: Pet, country: string): Check[] {
  if (pet.species !== "dog" || !pet.breed) return [];
  const b = pet.breed.toLowerCase();
  const out: Check[] = [];
  const pit = has(b, "pit bull", "pitbull");
  const amstaff = has(b, "american staffordshire");
  const staffy = has(b, "staffordshire bull terrier");
  const bull = /(^|[^a-z])bull terrier/.test(b) && !staffy;
  if (country === "DE" && (pit || amstaff || staffy || bull)) {
    out.push({ state: "no", title: "This breed may not enter Germany", text: `${pet.breed} is on Germany's federal list of banned breeds (crosses included). A stay of up to four weeks with a person who does not live in Germany is the exception, with documents. Read the rule before you go.`, rule: "banned_breeds" });
  }
  if (country === "FR" && (pit || amstaff || staffy || has(b, "mastiff", "boerboel", "boerbull", "tosa", "rottweiler"))) {
    out.push({ state: "warn", title: "France has strict rules for this kind of dog", text: `Dogs of the ${pet.breed} type can be category 1 (banned) or category 2 (strict conditions that French Customs says make short stays almost impossible). Carry a vet attestation if your dog could be taken for one.`, rule: "dangerous_dogs_category_1" });
  }
  if (country === "ES" && (pit || amstaff || staffy || has(b, "rottweiler", "dogo argentino", "fila brasileiro", "tosa", "akita"))) {
    out.push({ state: "warn", title: "A potentially dangerous dog in Spain", text: `${pet.breed} is on Spain's list. In public it must wear a muzzle and be on a lead shorter than 2 metres, one dog per person. A licence and insurance can be asked for.`, rule: "potentially_dangerous_dogs" });
  }
  if (country === "IE" && has(b, "american bully", "xl bully")) {
    out.push({ state: "warn", title: "XL Bully dogs cannot be imported into Ireland", text: "If your dog is an XL Bully, it cannot come into Ireland.", rule: "xl_bully_ban" });
  }
  return out;
}

export function checkTrip(pet: Pet, country: string | null, date: string): Check[] {
  const out: Check[] = [];
  const name = pet.name;

  // Microchip (eu-base/microchip)
  out.push(pet.microchip
    ? { state: "ok", title: "Microchip", text: `${name} has a microchip number in PawID.`, rule: "microchip" }
    : { state: "no", title: "Microchip missing", text: `Add the 15 digit microchip number from the passport. Without a microchip ${name} cannot travel between EU countries.`, rule: "microchip" });

  // Rabies vaccine valid on the day (eu-base/rabies_vaccination, waiting_period_after_primary_vaccination)
  const rab = pet.vaccinations.filter((v) => v.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
  if (!rab) {
    out.push({ state: "no", title: "No rabies vaccine entered", text: `Add the rabies vaccine dates from the passport. ${name} needs a valid rabies vaccination to travel.`, rule: "rabies_vaccination" });
  } else if (rab.validUntil < date) {
    out.push({ state: "no", title: "Rabies vaccine expired by then", text: `It is valid until ${d(rab.validUntil)}, before your travel date. A vaccine given after it expires counts as a first one again, with a ${WAIT_DAYS} day wait.`, rule: "waiting_period_after_primary_vaccination" });
  } else {
    const readyOn = addDays(rab.administeredOn, WAIT_DAYS);
    if (pet.boosterInTime) {
      out.push({ state: "ok", title: "Rabies vaccine valid", text: `Valid until ${d(rab.validUntil)}. You marked it as a booster given in time, so there is no waiting period.`, rule: "rabies_vaccination" });
    } else if (readyOn <= date) {
      out.push({ state: "ok", title: "Rabies vaccine valid", text: `Valid until ${d(rab.validUntil)}. If this was the first vaccination, the ${WAIT_DAYS} days after it are over by your travel date.`, rule: "waiting_period_after_primary_vaccination" });
    } else {
      out.push({ state: "warn", title: `Wait ${WAIT_DAYS} days after a first vaccination`, text: `If this was ${name}'s first rabies vaccination, it is valid for travel only from ${d(readyOn)}. If it was a booster given before the previous one expired, there is no wait: tick "Booster given in time" in the pet's details.`, rule: "waiting_period_after_primary_vaccination" });
    }
  }

  // Young animals: all five covered countries ask for valid rabies protection (eu-base/young_animals and overrides)
  if (pet.birthDate) {
    const weeks = Math.floor((Date.parse(date) - Date.parse(pet.birthDate)) / (7 * DAY));
    if (weeks < 16) out.push({ state: "warn", title: `${name} is ${weeks} weeks old on that day`, text: "Most EU countries do not accept young pets without valid rabies protection. Read the young animals rule for this country.", rule: "young_animals" });
  }

  // Tapeworm (eu-base/echinococcus_treatment)
  if (country && TAPEWORM_COUNTRIES.includes(country)) {
    if (pet.species === "dog") {
      out.push({ state: "todo", title: "Tapeworm treatment before you arrive", text: `A vet must treat ${name} against tapeworm between 24 and 120 hours (1 to 5 days) before you arrive, and write it in the passport. For arrival on ${d(date)}: the vet visit must fall between ${d(addDays(date, -5))} and ${d(addDays(date, -1))}, at least 24 hours and at most 120 hours before your arrival time.`, rule: "echinococcus_treatment" });
    } else {
      out.push({ state: "ok", title: "No tapeworm treatment for cats", text: "The tapeworm treatment is for dogs only.", rule: "echinococcus_treatment" });
    }
  }

  out.push(...(country ? breedChecks(pet, country) : []));

  // Passport (eu-base/passport)
  out.push({ state: "todo", title: "Bring the EU pet passport", text: "PawID is not an official document. Carry the paper passport filled in by your vet.", rule: "passport" });
  return out;
}

/** The rules of a country, verified first. */
export function countryRules(country: string | null) {
  return rulesFor(country);
}

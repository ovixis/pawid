import type { Dog, Vaccination } from "./schema";

export type ExpiryStatus = "valid" | "expiring_soon" | "expired" | "missing";

export interface RabiesCheck {
  status: ExpiryStatus;
  validUntil?: string;
  daysLeft?: number;
}

const DAY_MS = 86_400_000;

/** Parse YYYY-MM-DD as UTC midnight. */
function toUtc(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtc(toIso) - toUtc(fromIso)) / DAY_MS);
}

/** Pick the rabies entry with the latest validUntil. */
export function latestRabies(dog: Dog): Vaccination | undefined {
  return dog.vaccinations
    .filter((v) => v.kind === "rabies")
    .sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
}

/**
 * Status of the rabies vaccination on a given day (default: today, UTC).
 * `warnDays` is the window in which we say "expiring soon".
 * This only reads the dates written in the passport. It does not decide legal validity.
 */
export function checkRabies(dog: Dog, today: string, warnDays = 30): RabiesCheck {
  const v = latestRabies(dog);
  if (!v) return { status: "missing" };
  const daysLeft = daysBetween(today, v.validUntil);
  if (daysLeft < 0) return { status: "expired", validUntil: v.validUntil, daysLeft };
  if (daysLeft <= warnDays) return { status: "expiring_soon", validUntil: v.validUntil, daysLeft };
  return { status: "valid", validUntil: v.validUntil, daysLeft };
}

export interface Reminder {
  dogId: string;
  kind: "rabies" | "other";
  validUntil: string;
  /** Day to send the reminder. */
  sendOn: string;
}

function addDays(iso: string, days: number): string {
  return new Date(toUtc(iso) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Reminder dates for each vaccination, e.g. 30 and 7 days before expiry. Past dates are dropped. */
export function remindersFor(dog: Dog, today: string, offsets: number[] = [30, 7]): Reminder[] {
  const out: Reminder[] = [];
  for (const v of dog.vaccinations) {
    for (const off of offsets) {
      const sendOn = addDays(v.validUntil, -off);
      if (sendOn >= today) out.push({ dogId: dog.id, kind: v.kind, validUntil: v.validUntil, sendOn });
    }
  }
  return out.sort((a, b) => a.sendOn.localeCompare(b.sendOn));
}

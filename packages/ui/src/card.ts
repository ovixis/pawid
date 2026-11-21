import { countryName, esc, longDate, svgOf } from "./html";
import { I_cat, I_dog } from "./icons";
import { pawidMark } from "./brand";

/** The fields a pet card can show. Same names as ShareCard in @pawid/core. */
export interface CardData {
  species?: "dog" | "cat";
  name: string;
  breed?: string;
  sex?: "female" | "male";
  weightKg?: number;
  birthDate?: string;
  microchip?: string;
  chipDate?: string;
  passportNumber?: string;
  homeCountry?: string;
  rabiesGivenOn?: string;
  rabiesValidUntil?: string;
  rabiesVaccine?: string;
  boosterInTime?: boolean;
  vetName?: string;
  vetPhone?: string;
  owner?: string;
  notes?: string;
}

export type RabiesState = "valid" | "soon" | "expired";

export function rabiesState(validUntil: string | undefined, todayIso: string, warnDays = 30): RabiesState | null {
  if (!validUntil) return null;
  const days = Math.round((Date.parse(`${validUntil}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / 86_400_000);
  if (days < 0) return "expired";
  return days <= warnDays ? "soon" : "valid";
}

const RABIES_PILL: Record<RabiesState, [string, string]> = {
  valid: ["Valid today", "pw-status-ok"],
  soon: ["Valid today, expires soon", "pw-status-warn"],
  expired: ["Expired", "pw-status-no"],
};

let HIDE_EMPTY = false;

function row(label: string, value: string | undefined, raw = false): string {
  if (HIDE_EMPTY && (value === undefined || value === "")) return "";
  const v = value === undefined || value === "" ? `<dd class="pw-empty">Not given</dd>` : `<dd>${raw ? value : esc(value)}</dd>`;
  return `<div class="pw-pc-row"><dt>${esc(label)}</dt>${v}</div>`;
}

function section(title: string, rows: string[], wide = false): string {
  return `<section${wide ? ` class="pw-pc-wide"` : ""}><h3>${esc(title)}</h3><dl>${rows.join("")}</dl></section>`;
}

export interface CardOptions {
  todayIso: string;
  /** Text in the navy band, right side (for example "Link valid until 3 December 2026"). */
  meta?: string;
  /** Image for the pet (3D emoji) when the page may load images; otherwise an icon in a ring. */
  imageSrc?: string;
  /** Heading level of the pet's name: 1 on a page of its own, 2 inside the app. */
  headingLevel?: 1 | 2;
  /** Only show sections that have data (the venue view); the owner's own view shows all. */
  hideEmpty?: boolean;
  /** "Declared by the owner…" footer. Always on for venues. */
  footer?: string;
}

const DEFAULT_FOOTER =
  "Declared by the owner. Not verified by a vet. Not an official document: the EU pet passport and the vet's papers remain the official documents.";

/** The pet card as HTML. Every value is escaped here, nowhere else. */
/** 380 260 000 123 456: easier to compare with the passport at a desk. */
export function groupChip(chip: string): string {
  return chip.replace(/(\d{3})(?=\d)/g, "$1\u2009");
}

export function petCardHtml(c: CardData, o: CardOptions): string {
  HIDE_EMPTY = o.hideEmpty === true;
  const species = c.species === "cat" ? "Cat" : "Dog";
  const sub = [species, c.breed, c.sex ? (c.sex === "female" ? "Female" : "Male") : undefined, c.weightKg ? `${c.weightKg} kg` : undefined]
    .filter(Boolean)
    .join(", ");
  const h = o.headingLevel ?? 2;
  const pic = o.imageSrc
    ? `<img src="${esc(o.imageSrc)}" alt="" width="64" height="64">`
    : `<span class="pw-ring">${svgOf(c.species === "cat" ? I_cat : I_dog)}</span>`;

  const rab = rabiesState(c.rabiesValidUntil, o.todayIso);
  const until = c.rabiesValidUntil
    ? `${esc(longDate(c.rabiesValidUntil))}${rab ? ` <span class="pw-status ${RABIES_PILL[rab][1]}">${RABIES_PILL[rab][0]}</span>` : ""}`
    : undefined;

  const ident = [
    row("Microchip", c.microchip ? `<span class="pw-mono">${esc(groupChip(c.microchip))}</span>` : undefined, true),
    row("Implanted on", longDate(c.chipDate)),
    row("Pet passport", c.passportNumber ? `<span class="pw-mono">${esc(c.passportNumber)}</span>` : undefined, true),
    row("Home country", countryName(c.homeCountry)),
    row("Born", longDate(c.birthDate)),
  ];
  const rabies = [
    row("Given on", longDate(c.rabiesGivenOn)),
    row("Valid until", until, true),
    row("Vaccine", c.rabiesVaccine),
    row("Booster in time", c.boosterInTime === undefined ? undefined : c.boosterInTime ? "Yes" : "No"),
  ];
  const vet = [
    row("Name", c.vetName),
    row("Phone", c.vetPhone ? `<a class="pw-link" href="tel:${esc(c.vetPhone.replace(/[^\d+]/g, ""))}">${esc(c.vetPhone)}</a>` : undefined, true),
  ];

  const has = (...v: unknown[]) => !o.hideEmpty || v.some((x) => x !== undefined && x !== "");
  const parts = [
    has(c.microchip, c.chipDate, c.passportNumber, c.homeCountry, c.birthDate) ? section("Identification", ident) : "",
    has(c.rabiesGivenOn, c.rabiesValidUntil, c.rabiesVaccine) ? section("Rabies vaccine", rabies) : "",
    has(c.vetName, c.vetPhone) ? section("Vet", vet) : "",
    c.owner ? section("Owner", [row("First name", c.owner)]) : "",
    c.notes ? `<section class="pw-pc-wide"><h3>Notes from the owner</h3><p class="pw-pc-notes">${esc(c.notes)}</p></section>` : "",
  ].join("");

  return `<article class="pw-card pw-pc">
<header class="pw-pc-head"><p class="pw-pc-brand">${pawidMark()} PawID pet card</p>${o.meta ? `<p class="pw-pc-meta">${esc(o.meta)}</p>` : ""}</header>
<div class="pw-pc-hero">${pic}<div><h${h}>${esc(c.name)}</h${h}><p>${esc(sub)}</p></div></div>
<div class="pw-pc-grid">${parts}</div>
<footer class="pw-pc-foot">${esc(o.footer ?? DEFAULT_FOOTER)}</footer>
</article>`;
}

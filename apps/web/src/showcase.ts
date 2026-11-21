// Shared blocks for the venues page and the install guide: where PawID works, and the app on a phone.
import type { IconName } from "@pawid/ui";
import { el, svg } from "./dom";

type Part = "scanner" | "policy" | "button" | "travel";
const PART_NAME: Record<Part, string> = { scanner: "Scanner", policy: "Pet rules", button: "Button", travel: "Travel check" };

const PLACES: { icon: IconName; title: string; text: string; parts: Part[] }[] = [
  { icon: "hotel", title: "Hotels and B&Bs", text: "Get the pet card before arrival, check it at reception.", parts: ["button", "scanner", "policy"] },
  { icon: "fork", title: "Restaurants", text: "Say where dogs can sit, check a card at the table.", parts: ["policy", "scanner"] },
  { icon: "beer", title: "Bars and cafés", text: "Pet rules by the door, on your site and your menu page.", parts: ["policy", "scanner"] },
  { icon: "museum", title: "Museums and institutions", text: "Which halls are open to pets, and what to bring.", parts: ["policy", "scanner", "travel"] },
  { icon: "beach", title: "Beaches and parks", text: "Rules for dog areas, a quick check at the entrance.", parts: ["policy", "scanner"] },
  { icon: "tent", title: "Campsites", text: "Pet rules for pitches, the card before guests arrive.", parts: ["button", "policy", "scanner"] },
  { icon: "pin", title: "Tourism offices", text: "What a dog needs to come to your country.", parts: ["travel"] },
  { icon: "ship", title: "Ferries and trains", text: "Travel rules with their official sources.", parts: ["travel", "policy"] },
];

/** Cards for each kind of place, with the components that fit it. On /venues the chips jump to each component. */
export function placeCards(linkParts: boolean): HTMLElement {
  return el(
    "ul",
    { class: "places", attrs: { role: "list" } },
    ...PLACES.map((p) =>
      el("li", { class: "place" },
        el("span", { class: "place-ic" }, svg(p.icon)),
        el("h3", {}, p.title),
        el("p", {}, p.text),
        el("p", { class: "place-parts" }, ...p.parts.map((x) => (linkParts ? el("a", { href: `#${x}` }, PART_NAME[x]) : el("span", {}, PART_NAME[x])))),
      ),
    ),
  );
}

const SCREENS = [
  { src: "/shots/home.webp", alt: "PawID on a phone: the pet list with Luna, a Border Collie, and a green label: rabies vaccine valid.", caption: "Your pets, with the rabies vaccine status" },
  { src: "/shots/card.webp", alt: "Luna's pet card: microchip, pet passport number, home country, birth date and the rabies vaccine dates.", caption: "The pet card, copied from the passport" },
  { src: "/shots/share.webp", alt: "A QR code to show the venue, valid for 15 minutes, with Send and Copy link buttons.", caption: "A code for the venue: 15 minutes or 7 days" },
];

/** Real screenshots of the app (demo pet "Luna") in phone frames. A swipe row on phones, side by side on wide screens. */
export function phoneRow(steps = false): HTMLElement {
  return el(
    "ol",
    { class: `phones${steps ? " phones-steps" : ""}`, tabIndex: 0, attrs: { "aria-label": "PawID screens on a phone" } },
    ...SCREENS.map((s, i) =>
      el("li", { class: "phone-item" },
        el("figure", { class: "phone" },
          el("div", { class: "phone-screen" }, el("img", { src: s.src, alt: s.alt, width: 390, height: 844, loading: "lazy", decoding: "async" })),
          el("figcaption", {}, steps ? el("b", {}, `${i + 2}. `) : "", s.caption),
        ),
      ),
    ),
  );
}

export const SHOWCASE_CSS = /* css */ `
/* Phones: one compact row per place (icon, name, components). Wide screens: cards with a line of text. */
.places { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.place { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); column-gap: .75rem; row-gap: .25rem; align-items: center; padding: .625rem .75rem; border-radius: var(--pw-radius-card); background: var(--pw-canvas); box-shadow: inset 0 0 0 1px var(--pw-line); min-width: 0; }
.place .place-ic { grid-row: span 2; }
.place > p:not(.place-parts) { display: none; }
@media (min-width: 40rem) {
  .places { grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .75rem; }
  .place { grid-template-columns: none; align-items: start; align-content: start; gap: .375rem; padding: .875rem; }
  .place .place-ic { grid-row: auto; }
  .place > p:not(.place-parts) { display: block; }
}
.place-ic { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: var(--pw-navy-800); color: var(--pw-gold-400); }
.place-ic .pw-icon { width: 1.375rem; height: 1.375rem; }
.place h3 { margin: 0; font-size: var(--pw-text-base); font-weight: 800; letter-spacing: -.01em; line-height: 1.25; }
.place p { margin: 0; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); line-height: 1.45; }
.place .place-parts { display: flex; flex-wrap: wrap; gap: .25rem; }
@media (min-width: 40rem) { .place h3 { margin-top: .25rem; } }
.place-parts > * { display: inline-flex; align-items: center; min-height: 1.5rem; padding: 0 .5rem; border-radius: 9999px; background: var(--pw-gold-100); color: var(--pw-navy-800); font-size: .75rem; font-weight: 700; text-decoration: none; }
.place-parts a:hover { background: var(--pw-gold-400); }
.place-parts a:focus-visible { outline: 2px solid var(--pw-navy-800); outline-offset: 2px; }

.phones { list-style: none; margin: 0; padding: .25rem .25rem 1rem; display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; scrollbar-width: thin; }
.phones:focus-visible { outline: 2px solid var(--pw-gold-400); outline-offset: 2px; border-radius: var(--pw-radius-card); }
.phone-item { flex: 0 0 min(15rem, 72%); scroll-snap-align: center; }
@media (min-width: 46rem) { .phones { overflow: visible; justify-content: center; } .phone-item { flex: 0 1 15rem; } }
.phone { margin: 0; display: grid; gap: .75rem; justify-items: center; }
.phone-screen { position: relative; width: 100%; aspect-ratio: 390 / 844; padding: .5rem; border-radius: 2.25rem; background: #0d1426; box-shadow: inset 0 0 0 2px #2a3550, 0 18px 40px -18px rgb(13 23 43 / .55); }
.phone-screen::before { content: ""; position: absolute; top: 1rem; left: 50%; width: 28%; height: .875rem; translate: -50% 0; border-radius: 9999px; background: #0d1426; z-index: 1; }
.phone-screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 1.75rem; background: var(--pw-canvas); }
.phone figcaption { text-align: center; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); max-width: 14rem; }
.phone figcaption b { color: var(--pw-ink); }
`;

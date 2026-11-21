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
        el("span", { class: "place-ic pw-tile" }, svg(p.icon)),
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
.place { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); column-gap: .75rem; row-gap: .25rem; align-items: center; padding: .625rem .75rem; border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); min-width: 0; transition: box-shadow 200ms var(--pw-ease-out), translate 200ms var(--pw-ease-out); }
@media (hover: hover) { .place:hover { box-shadow: var(--pw-shadow-lifted); translate: 0 -2px; } }
.place .place-ic { grid-row: span 2; }
.place > p:not(.place-parts) { display: none; }
@media (min-width: 40rem) {
  .places { grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: .75rem; }
  .place { grid-template-columns: none; align-items: start; align-content: start; gap: .375rem; padding: .875rem; }
  .place .place-ic { grid-row: auto; }
  .place > p:not(.place-parts) { display: block; }
}
.place-ic.pw-tile { width: 2.5rem; height: 2.5rem; }
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
.phone-screen { position: relative; width: 100%; aspect-ratio: 390 / 844; padding: .5rem; border-radius: 2.25rem; background: linear-gradient(160deg, #34415e, #0d1426 45%); box-shadow: inset 0 0 0 1.5px rgb(255 255 255 / .12), inset 0 0 0 3px #0b1222, 0 2px 4px rgb(16 24 40 / .12), 0 30px 60px -24px rgb(13 23 43 / .6); }
.phone-screen::before { content: ""; position: absolute; top: 1rem; left: 50%; width: 28%; height: .875rem; translate: -50% 0; border-radius: 9999px; background: #0d1426; z-index: 1; }
.phone-screen img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; border-radius: 1.75rem; background: var(--pw-canvas); }
.phone figcaption { text-align: center; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); max-width: 14rem; }
.phone figcaption b { color: var(--pw-ink); }
`;

export const REPO = "https://github.com/ovixis/pawid";

/** Invitation to contribute on GitHub, with the big GitHub mark. */
export function githubInvite(): HTMLElement {
  const big = svg("githubFill");
  big.classList.add("gh-mark");
  const way = (icon: IconName, title: string, text: string) => el("li", {}, svg(icon), el("span", {}, el("b", {}, title), " ", text));
  return el(
    "section",
    { class: "gh", id: "contribute", attrs: { "aria-labelledby": "gh-title" } },
    el("a", { class: "gh-logo", href: REPO, rel: "noopener", attrs: { "aria-label": "PawID on GitHub" } }, big),
    el("div", { class: "gh-body" },
      el("p", { class: "gh-kicker" }, "Open source on GitHub"),
      el("h2", { id: "gh-title" }, "Help make PawID better"),
      el("p", {}, "PawID is free and open to everyone. Vets, pet owners, hotels and developers can all help."),
      el("ul", { class: "gh-ways" },
        way("certificate", "Correct a travel rule", "with a link to the official source."),
        way("translate", "Translate:", "help bring PawID to your language."),
        way("bug", "Report a bug", "or suggest an idea."),
        way("pullRequest", "Send code", "for the app, the API or the components."),
      ),
      el("div", { class: "gh-actions" },
        el("a", { class: "pw-btn gh-btn", href: REPO, rel: "noopener" }, svg("githubFill"), "Contribute on GitHub"),
        el("a", { class: "pw-btn gh-btn-2", href: `${REPO}/issues/new/choose`, rel: "noopener" }, "Open an issue"),
        el("a", { class: "pw-btn gh-btn-2", href: `${REPO}/stargazers`, rel: "noopener" }, svg("star"), "Star"),
      ),
    ),
  );
}

export const GITHUB_CSS = /* css */ `
.gh { display: grid; gap: 1.25rem; padding: 1.5rem 1.25rem; border-radius: var(--pw-radius-card); background: #0d1117; color: #e6edf3; overflow: hidden; position: relative; }
.gh::after { content: ""; position: absolute; inset: auto -4rem -6rem auto; width: 16rem; height: 16rem; border-radius: 50%; background: radial-gradient(closest-side, rgb(245 184 0 / .18), transparent); pointer-events: none; }
.gh-logo { display: grid; place-items: center; width: 5.5rem; height: 5.5rem; border-radius: 1.5rem; background: #fff; color: #0d1117; box-shadow: 0 10px 30px -10px rgb(0 0 0 / .6); }
.gh-logo:focus-visible, .gh a:focus-visible { outline: 2px solid var(--pw-gold-400); outline-offset: 3px; }
.gh-mark { width: 4rem; height: 4rem; }
.gh-body { display: grid; gap: .75rem; position: relative; z-index: 1; min-width: 0; }
.gh-kicker { margin: 0; color: var(--pw-gold-400); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.gh h2 { margin: 0; color: #fff; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; }
.gh p { margin: 0; color: #c9d1d9; }
.gh-ways { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.gh-ways li { display: grid; grid-template-columns: 1.25rem 1fr; gap: .625rem; align-items: start; color: #c9d1d9; }
.gh-ways .pw-icon { color: var(--pw-gold-400); margin-top: .15rem; }
.gh-ways b { color: #fff; }
.gh-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .25rem; }
.gh-btn { background: var(--pw-gold-400); color: #16181d; }
.gh-btn:hover { background: #ffd23f; }
.gh-btn-2 { background: rgb(255 255 255 / .08); color: #fff; box-shadow: inset 0 0 0 1px rgb(255 255 255 / .18); }
.gh-btn-2:hover { background: rgb(255 255 255 / .14); }
@media (min-width: 40rem) {
  .gh { grid-template-columns: auto minmax(0, 1fr); gap: 1.75rem; padding: 2rem; align-items: start; }
  .gh-logo { width: 7rem; height: 7rem; }
  .gh-mark { width: 5rem; height: 5rem; }
  .gh-ways { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .625rem 1.25rem; }
}
`;

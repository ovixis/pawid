// "PawID for venues": every component live, with the code to paste.
// The page renders the components from source; venues load the same code from /embed/v1.js.
import "@pawid/widgets";
import { BY_HOSPET } from "@pawid/ui";
import { CODE_WINDOW_CSS, codeWindow } from "./codewin";
import { GITHUB_CSS, SHOWCASE_CSS, githubInvite, phoneRow, placeCards } from "./showcase";
import { el, revealOnScroll, svg, topBar, siteFooter } from "./dom";
import { injectStyles } from "./style";
import { moveToNewAddress } from "./move";

injectStyles();
moveToNewAddress();

const EMBED = `${location.origin}/embed/v1.js`;
const API = "https://pawid-api.hospet.workers.dev";

const css = document.createElement("style");
css.textContent = `
.v-hero { color: #fff; display: grid; gap: .75rem; }
.v-hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.6vw, 2.5rem); line-height: 1.08; font-weight: 800; letter-spacing: -.03em; }
.v-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.v-hero p { margin: 0; color: rgb(255 255 255 / .85); max-width: 40rem; }
.v-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .v-sec { padding: 1.5rem; } }
.v-sec > * { min-width: 0; }
.v-sec h2 { margin: 0; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.v-sec > p { margin: 0; color: var(--pw-ink-muted); }
.v-for { display: flex; flex-wrap: wrap; gap: .375rem; }
.v-for span { display: inline-flex; align-items: center; height: 1.75rem; padding: 0 .7rem; border-radius: 9999px; background: var(--pw-surface-muted); font-size: .8125rem; font-weight: 700; }
.v-demo { padding: 1rem; border-radius: var(--pw-radius-card); background: var(--pw-canvas); box-shadow: inset 0 0 0 1px var(--pw-line); }
.v-get summary { cursor: pointer; display: flex; align-items: center; justify-content: space-between; min-height: 2.75rem; font-weight: 700; color: var(--pw-navy-700); list-style: none; }
.v-get summary::-webkit-details-marker { display: none; }
.v-get summary::after { content: "+"; color: var(--pw-ink-muted); font-weight: 600; }
.v-get[open] summary::after { content: "\\2212"; }
.v-get-in { display: grid; gap: .75rem; padding-top: .25rem; }
.v-notes { margin: 0; padding-left: 1.1rem; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); display: grid; gap: .25rem; }
.v-steps { counter-reset: s; display: grid; gap: .75rem; margin: 0; padding: 0; list-style: none; }
.v-steps li { counter-increment: s; display: grid; grid-template-columns: 2rem 1fr; gap: .75rem; align-items: start; }
.v-steps li::before { content: counter(s); display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .75rem; background: var(--pw-grad-gold); box-shadow: inset 0 1px 0 rgb(255 255 255 / .6), 0 1px 2px rgb(16 24 40 / .12), 0 6px 14px -6px rgb(245 184 0 / .55); color: var(--pw-navy-800); font-weight: 800; }
.v-steps b { display: block; }
.v-steps span { color: var(--pw-ink-muted); }
${CODE_WINDOW_CSS}${SHOWCASE_CSS}${GITHUB_CSS}
.v-links { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }`;
document.head.append(css);

interface Snippet { file: string; code: string; what: string; result: { label: string; text: string } }

function section(id: string, title: string, intro: string, forWho: string[], demo: HTMLElement, snippet: Snippet, notes: string[]): HTMLElement {
  return el(
    "section",
    { class: "pw-card v-sec", id },
    el("h2", {}, title),
    el("p", {}, intro),
    el("div", { class: "v-for", attrs: { "aria-label": "For" } }, ...forWho.map((f) => el("span", {}, f))),
    el("div", { class: "v-demo" }, demo),
    el("details", { class: "v-get" },
      el("summary", {}, "Get the code"),
      el("div", { class: "v-get-in" },
        codeWindow({ ...snippet, lang: "html" }),
        notes.length ? el("ul", { class: "v-notes" }, ...notes.map((n) => el("li", {}, n))) : "",
      ),
    ),
  );
}

/** Builds a demo element with textContent only. */
function demoEl(tag: string, attrs: Record<string, string>, json?: object): HTMLElement {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (json) {
    const s = document.createElement("script");
    s.type = "application/json";
    s.textContent = JSON.stringify(json);
    e.append(s);
  }
  return e;
}

const POLICY = {
  name: "Trattoria Da Rosa",
  dogs: "yes",
  cats: "conditions",
  maxWeightKg: 30,
  fee: "No fee",
  where: ["Terrace", "Garden", "Inside, near the window"],
  ask: ["leash", "rabies"],
  notes: "Water bowls at the door. Ask us for a quiet table.",
  updated: "2026-11-21",
};
const policyJson = JSON.stringify(POLICY, null, 2).replace(/</g, "\\u003c");

const scriptTag = `<script type="module" src="${EMBED}"></script>`;

const header = topBar("/", BY_HOSPET.href);

const main = el(
  "main",
  { id: "main" },
  el("section", { class: "v-hero" },
    el("p", { class: "pw-eyebrow" }, "For places that welcome pets"),
    el("h1", {}, "PawID for places that ", el("em", {}, "welcome pets.")),
    el("p", {}, "Four free components for hotels, restaurants, bars, museums, tourist offices and places to visit in Europe. Paste one line of code, keep your own colours, no account and no fee."),
  ),
  el("section", { class: "pw-card v-sec", id: "places" },
    el("h2", {}, "Where PawID works"),
    el("p", {}, "Pick the components that fit your place. Tap one to see it working."),
    placeCards(true),
  ),
  el("section", { class: "pw-card v-sec", id: "guests" },
    el("h2", {}, "What your guests see"),
    el("p", {}, "The free PawID app on the guest's phone. Pet owners copy the details from the pet passport once, then show a code at your door or send you a link before they arrive."),
    phoneRow(),
    el("div", { class: "v-links" },
      el("a", { class: "pw-btn pw-btn-primary", href: "/" }, "Open PawID"),
      el("a", { class: "pw-btn pw-btn-secondary", href: "/install" }, svg("download"), "How to install it"),
    ),
  ),
  el("section", { class: "pw-card v-sec" },
    el("h2", {}, "How to add it"),
    el("ol", { class: "v-steps" },
      el("li", {}, el("div", {}, el("b", {}, "Add the script once"), el("span", {}, "In the page, or in your site builder's custom code (WordPress, Wix, Squarespace, Webflow)."))),
      el("li", {}, el("div", {}, el("b", {}, "Paste a component where you want it"), el("span", {}, "Each one below has its code."))),
      el("li", {}, el("div", {}, el("b", {}, "Optional: your colour"), el("span", {}, "Set --pawid-accent on the component or any parent."))),
    ),
    codeWindow({ file: "your-page.html", code: scriptTag, lang: "html", what: "the PawID script tag", result: { label: "Loaded once", text: "about 14 kB, works with a strict Content Security Policy" } }),
  ),
  section(
    "scanner",
    "Check a guest's pet",
    "Staff scan the QR code on the guest's phone, or paste the link the guest sent, and see the pet card: microchip, rabies vaccine, vet. The card says the details are declared by the owner.",
    ["Hotel reception", "Restaurant", "Museum desk", "Dog beach"],
    demoEl("pawid-scanner", {}),
    { file: "reception.html", code: "<pawid-scanner></pawid-scanner>", what: "the scanner code", result: { label: "Shows", text: "Scan a PawID code · or paste the link the guest sent" } },
    [
      "The camera needs a page on https. Inside an iframe, the iframe needs allow=\"camera\".",
      "A scanned code is never opened as a link: only PawID codes are checked, anything else is refused.",
      "Any phone camera can also open the code without this component.",
    ],
  ),
  section(
    "policy",
    "Your pet rules",
    "Show guests what you accept, in the same clear look: dogs and cats, size, fee, where pets can go, what you ask at arrival.",
    ["Hotels and B&Bs", "Restaurants and bars", "Museums", "Parks and beaches"],
    demoEl("pawid-policy", { "with-button": "" }, POLICY),
    { file: "pets.html", code: `<pawid-policy with-button>\n  <script type="application/json">\n${policyJson.replace(/^/gm, "  ")}\n  </script>\n</pawid-policy>`, what: "the pet policy code", result: { label: "Shows", text: "Pets at Trattoria Da Rosa · Dogs: Welcome · Up to 30 kg" } },
    [
      "dogs, cats, aloneInRoom: \"yes\", \"conditions\" or \"no\". maxWeightKg, maxPets: numbers. where, ask: lists of words (ask knows leash, muzzle, microchip, rabies, passport, pawid).",
      "updated: the date you last checked your rules (YYYY-MM-DD). link: your own page with the full rules (https).",
      "with-button adds \"Show your pet's PawID\". If your text has </script> in it, write <\\/script>.",
      "These are your rules: PawID shows them as yours and does not check them.",
    ],
  ),
  section(
    "button",
    "\"Show your pet's PawID\" button",
    "For a booking confirmation or a \"before you arrive\" email page. It opens the PawID app with your name: the guest picks the pet and sends you a link valid for 7 days.",
    ["Booking confirmation", "Pre-arrival page", "Table reservation"],
    demoEl("pawid-button", { venue: "Hotel Bella Vista" }),
    { file: "booking-confirmed.html", code: `<pawid-button venue="Hotel Bella Vista"></pawid-button>`, what: "the button code", result: { label: "Opens", text: "PawID, ready to show a pet to Hotel Bella Vista for 7 days" } },
    ["venue: your name, shown to the guest. days=\"0\" for a 15 minute code to show at the door instead. label: your own button text."],
  ),
  section(
    "travel",
    "Coming to your country with a dog",
    "What a dog needs to travel to your country, from PawID's rules: each rule with its official source and the date it was checked. Rules not yet confirmed are shown apart and say so.",
    ["Tourism boards", "Museums and institutions", "Campsites", "Ferries and trains"],
    demoEl("pawid-travel-check", { country: "IT" }),
    { file: "visit-italy.html", code: `<pawid-travel-check country="IT"></pawid-travel-check>`, what: "the travel check code", result: { label: "Shows", text: "Coming to Italy with a dog · each rule with its official source" } },
    ["country: two letters (IT, FR, ES, DE…). Leave it out for the EU rules only.", "Not legal advice and not official. The rules come from EU and national authority pages."],
  ),
  el("section", { class: "pw-card v-sec", id: "developers" },
    el("h2", {}, "For developers"),
    el("p", {}, "Booking software, hotel apps and AI assistants can use the same rules and checks through the open API or the MCP server."),
    codeWindow({
      file: "travel-rules.sh",
      lang: "sh",
      what: "the API example",
      code: `# Rules for bringing a dog to Italy, each with its official source\ncurl -s "${API}/v1/rules?country=IT" \\\n  -H "Accept: application/json"`,
      result: { label: "200 OK", text: '"country": "IT" · rules with "sources" and "lastChecked"' },
    }),
    el("ul", { class: "dev-points" },
      el("li", {}, svg("check"), el("span", {}, el("b", {}, "Free, no API key"), ": up to 120 requests a minute from one address.")),
      el("li", {}, svg("check"), el("span", {}, el("b", {}, "Verify a guest's code"), " with GET /v1/verify, or read it on the page the QR code opens.")),
      el("li", {}, svg("check"), el("span", {}, el("b", {}, "MCP server at /mcp"), " with three read-only tools for AI assistants. ", el("a", { class: "pw-link", href: `${API}/v1/openapi.json` }, "OpenAPI description"), ".")),
    ),
  ),
  githubInvite(),
  el("section", { class: "pw-card v-sec" },
    el("h2", {}, "Good to know"),
    el("ul", { class: "v-notes" },
      el("li", {}, "Your colour: pawid-policy { --pawid-accent: #0e7c66; --pawid-accent-ink: #ffffff; }"),
      el("li", {}, `If your site has a Content Security Policy: script-src ${location.origin}; connect-src ${API}.`),
      el("li", {}, "What PawID counts: which component loaded on which site (the host name only), once per page. No cookies, no IP addresses, nothing about your guests."),
      el("li", {}, "PawID is not an official document. The EU pet passport, issued by an authorised vet, is."),
    ),
  ),
);

const footer = siteFooter();
document.getElementById("app")!.replaceChildren(header, main, footer);
revealOnScroll(document);

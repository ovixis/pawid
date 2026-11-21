// Makes the images used by README.md: category cards (SVG) and an example pet card as a venue sees it.
// Run: npx vite-node scripts/readme-assets.ts   (needs the Brave or Chrome path in CHROME, for the card picture)
import { writeFileSync } from "node:fs";
import { COMPONENTS, ICON_BODIES, PAGE, TOKENS, petCardHtml } from "@pawid/ui";

const out = new URL("../docs/readme/", import.meta.url).pathname;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/**
 * A card: an icon in a gold tile, a title and one line. All cards are the same size, so they line up
 * in rows on GitHub. Navy, so they read in GitHub's light and dark themes.
 */
const W = 300, H = 92;
function cta(file: string, icon: keyof typeof ICON_BODIES, title: string, line: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: ${esc(line)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22395f"/><stop offset="1" stop-color="#0f1b33"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd44a"/><stop offset="1" stop-color="#f5b800"/></linearGradient>
<radialGradient id="glow" cx="1" cy="0" r="0.9"><stop offset="0" stop-color="#ffc629" stop-opacity=".09"/><stop offset="1" stop-color="#ffc629" stop-opacity="0"/></radialGradient>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="url(#bg)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="url(#glow)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="#ffffff" stroke-opacity=".1"/>
<rect x="18" y="20" width="52" height="52" rx="15" fill="url(#gold)"/>
<rect x="18.5" y="20.5" width="51" height="51" rx="14.5" fill="none" stroke="#ffffff" stroke-opacity=".45"/>
<g transform="translate(29.6 31.6) scale(1.2)" color="#14233f">${ICON_BODIES[icon]}</g>
<text x="86" y="42" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-size="17" font-weight="700" fill="#ffffff">${esc(title)}</text>
<text x="86" y="63" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif" font-size="13.5" font-weight="500" fill="#c7d3e8">${esc(line)}</text>
</svg>
`;
  writeFileSync(out + file, svg);
}

cta("card-owners.svg", "paw", "Pet owners", "Open the app");
cta("card-venues.svg", "hotel", "Hotels and restaurants", "Add PawID to your site");
cta("card-vets.svg", "stethoscope", "Vets", "Confirm a pet in 30 seconds");
cta("card-developers.svg", "code", "Developers and AI", "API and MCP server");

cta("need-vets.svg", "stethoscope", "Vets for the pilot", "Register in 2 minutes");
cta("need-rules.svg", "scale", "Country rules", "Add a country");
cta("need-translations.svg", "translate", "Translations", "Bring PawID to your language");
cta("need-venues.svg", "store", "Venues", "Try the components");
cta("need-code.svg", "pullRequest", "Code", "Good first issues");
cta("need-bugs.svg", "bug", "Bugs and ideas", "Open an issue");
cta("need-support.svg", "heartHandshake", "Support PawID", "Add your name");
cta("need-security.svg", "shieldCheck", "Security reviews", "Report privately");

// The pet card a venue sees, with an example vet confirmation (example data, not a real vet or pet).
const card = petCardHtml(
  { species: "dog", name: "Luna", breed: "Border Collie", microchip: "380260000123456", rabiesGivenOn: "2026-03-01", rabiesValidUntil: "2029-02-28", rabiesVaccine: "Nobivac Rabies" },
  { todayIso: "2026-11-21", headingLevel: 1, hideEmpty: true, vet: { status: "confirmed", name: "Dr Example", registerBody: "Example Veterinary Register", registerNumber: "0000", on: "2026-11-21" } },
);
writeFileSync(out + "venue-card.html", `<!doctype html><meta charset="utf-8"><style>${TOKENS}${COMPONENTS}${PAGE} body{margin:0;padding:24px;background:#f4f6f8} .pw-pc{max-width:640px}</style>${card}`);
console.log("readme assets written");

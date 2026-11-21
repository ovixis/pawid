// Makes the images used by README.md: category buttons (SVG) and an example pet card as a venue sees it.
// Run: npx vite-node scripts/readme-assets.ts   (needs the Brave or Chrome path in CHROME, for the card picture)
import { writeFileSync } from "node:fs";
import { COMPONENTS, PAGE, TOKENS, petCardHtml } from "@pawid/ui";

const out = new URL("../docs/readme/", import.meta.url).pathname;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

/** A two line button: bold title, then the action. Width from the longer line. */
function btn(file: string, title: string, action: string, dark = true) {
  const w = Math.max(title.length * 8.5, action.length * 7.3 + 14) + 44;
  const bg = dark ? "#14233f" : "#f5b800";
  const fg = dark ? "#ffffff" : "#16181d";
  const ac = dark ? "#f5b800" : "#14233f";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w)}" height="60" viewBox="0 0 ${Math.round(w)} 60" role="img" aria-label="${esc(title)}: ${esc(action)}">
<rect width="${Math.round(w)}" height="60" rx="14" fill="${bg}"/>
<text x="22" y="26" font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="${fg}">${esc(title)}</text>
<text x="22" y="45" font-family="-apple-system, Segoe UI, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="${ac}">${esc(action)} →</text>
</svg>
`;
  writeFileSync(out + file, svg);
}

btn("btn-owners.svg", "Pet owners", "Open the app", false);
btn("btn-venues.svg", "Hotels, restaurants, museums", "Add PawID to your site");
btn("btn-vets.svg", "Vets", "Confirm a pet");
btn("btn-developers.svg", "Developers and AI", "API and MCP server");
btn("btn-contribute.svg", "Contribute", "Help on GitHub");

btn("need-vets.svg", "Vets for the pilot", "Register in 2 minutes");
btn("need-rules.svg", "Country rules", "Add a country");
btn("need-translations.svg", "Translations", "Bring PawID to your language");
btn("need-venues.svg", "Venues", "Try the components");
btn("need-code.svg", "Code", "Good first issues");
btn("need-bugs.svg", "Bugs and ideas", "Open an issue");

// The pet card a venue sees, with an example vet confirmation (example data, not a real vet or pet).
const card = petCardHtml(
  { species: "dog", name: "Luna", breed: "Border Collie", microchip: "380260000123456", rabiesGivenOn: "2026-03-01", rabiesValidUntil: "2029-02-28", rabiesVaccine: "Nobivac Rabies" },
  { todayIso: "2026-11-21", headingLevel: 1, hideEmpty: true, vet: { status: "confirmed", name: "Dr Example", registerBody: "Example Veterinary Register", registerNumber: "0000", on: "2026-11-21" } },
);
writeFileSync(out + "venue-card.html", `<!doctype html><meta charset="utf-8"><style>${TOKENS}${COMPONENTS}${PAGE} body{margin:0;padding:24px;background:#f4f6f8} .pw-pc{max-width:640px}</style>${card}`);
console.log("readme assets written");

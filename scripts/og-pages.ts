// Link preview pictures (1200 x 630) for every page except the manifesto (scripts/og-image.ts).
// Run: npx vite-node scripts/og-pages.ts
import sharp from "sharp";
import { ICON_BODIES, PAWID_MARK_BODY, type IconName } from "@pawid/ui";

const dir = new URL("../apps/web/public/og/", import.meta.url).pathname;
const F = "Helvetica Neue, Helvetica, Arial, sans-serif";
const GOLD = "#ffc629";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

interface Page { file: string; kicker: string; white: string[]; gold: string[]; sub: [string, string]; url: string; icon?: IconName }
const PAGES: Page[] = [
  { file: "home", kicker: "PawID", white: ["Your pet's passport details,"], gold: ["on your phone."], sub: ["Show a signed code at hotels, restaurants and museums.", "Free, open source, no account."], url: "pawid.hospet.eu" },
  { file: "venues", kicker: "PawID for venues", white: ["Check a pet's papers"], gold: ["with one scan."], sub: ["Free components for hotels, restaurants and museums.", "One line of code, no account, no fee."], url: "pawid.hospet.eu/venues", icon: "scan" },
  { file: "install", kicker: "Install PawID", white: ["On iPhone, Android"], gold: ["or a computer."], sub: ["No app store, no account. Add your pet", "from the EU pet passport in a few minutes."], url: "pawid.hospet.eu/install", icon: "cellphone" },
  { file: "vet", kicker: "PawID for vets", white: ["Confirm a passport"], gold: ["with your fingerprint."], sub: ["Microchip and rabies vaccine, confirmed on your phone.", "Free. Hotels then see it confirmed by a vet."], url: "pawid.hospet.eu/vet", icon: "stethoscope" },
  { file: "support", kicker: "Support PawID", white: ["Help keep it"], gold: ["free and open."], sub: ["Add your name as a vet, a venue or a pet owner.", "No money, no account."], url: "pawid.hospet.eu/support", icon: "heartHandshake" },
  { file: "ai", kicker: "PawID for AI assistants", white: ["Pet travel rules"], gold: ["for your AI."], sub: ["MCP server, open API and a skill for Claude,", "ChatGPT, Cursor and VS Code."], url: "pawid.hospet.eu/ai", icon: "chatbot" },
  { file: "rules", kicker: "Travel rules", white: ["Pet travel rules,"], gold: ["checked in the open."], sub: ["Every rule with its official source and date.", "Confirm or correct one with a source."], url: "pawid.hospet.eu/rules", icon: "factCheck" },
];

const ring = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const x = 945 + Math.cos(a) * 170, y = 315 + Math.sin(a) * 170;
  return `<g transform="translate(${(x - 16).toFixed(1)} ${(y - 16).toFixed(1)}) rotate(${((a * 180) / Math.PI + 90).toFixed(0)} 16 16) scale(1.333)" color="${GOLD}" opacity="${i % 2 ? 0.75 : 1}">${ICON_BODIES.pawFill}</g>`;
}).join("");

const visual = (icon?: IconName) => icon
  ? `<rect x="865" y="235" width="160" height="160" rx="40" fill="#14233f"/><rect x="865.5" y="235.5" width="159" height="159" rx="39.5" fill="none" stroke="#fff" stroke-opacity=".12"/>
     <g transform="translate(897 267) scale(4)" color="${GOLD}">${ICON_BODIES[icon]}</g>`
  : `<g transform="translate(865 235) scale(2.5)">${PAWID_MARK_BODY}</g>`;

for (const p of PAGES) {
  const rows = [...p.white.map((t) => [t, "#fff"]), ...p.gold.map((t) => [t, GOLD])];
  const big = rows.some(([t]) => t!.length > 19) ? 62 : 68;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22395f"/><stop offset="1" stop-color="#0c1629"/></linearGradient>
  <radialGradient id="g1" cx="0.85" cy="0.2" r="0.6"><stop offset="0" stop-color="${GOLD}" stop-opacity=".22"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0.05" cy="1" r="0.7"><stop offset="0" stop-color="#5680d6" stop-opacity=".35"/><stop offset="1" stop-color="#5680d6" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#fff" fill-opacity=".07"/></pattern>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/><rect width="1200" height="630" fill="url(#g1)"/><rect width="1200" height="630" fill="url(#g2)"/><rect width="1200" height="630" fill="url(#dots)"/>
${ring}${visual(p.icon)}
<text x="80" y="140" font-family="${F}" font-size="26" font-weight="700" fill="${GOLD}" letter-spacing="3">${esc(p.kicker.toUpperCase())}</text>
<text font-family="${F}" font-weight="800" letter-spacing="-2">${rows.map(([t, c], i) => `<tspan x="78" y="${230 + i * (big + 12)}" font-size="${big}" fill="${c}">${esc(t!)}</tspan>`).join("")}</text>
<text font-family="${F}" font-size="27" fill="#c7d3e8"><tspan x="80" y="440">${esc(p.sub[0])}</tspan><tspan x="80" y="480">${esc(p.sub[1])}</tspan></text>
<text x="80" y="565" font-family="${F}" font-size="24" font-weight="700" fill="#fff">${esc(p.url)}</text>
</svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(`${dir}${p.file}.png`);
}
console.log(`${PAGES.length} preview pictures written`);

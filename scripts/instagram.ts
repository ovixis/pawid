// Instagram post for the manifesto: a 4 slide carousel (1080 x 1350, 4:5) and a story (1080 x 1920).
// Run: npx vite-node scripts/instagram.ts. Facts only from the manifesto page, which cites its sources.
import sharp from "sharp";
import { ICON_BODIES, PAWID_MARK_BODY } from "@pawid/ui";

const dir = new URL("../apps/web/public/social/", import.meta.url).pathname;
const F = "Helvetica Neue, Helvetica, Arial, sans-serif";
const GOLD = "#ffc629", MUTED = "#c7d3e8";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const bg = (w: number, h: number) => `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22395f"/><stop offset="1" stop-color="#0c1629"/></linearGradient>
  <radialGradient id="g1" cx="0.9" cy="0.08" r="0.6"><stop offset="0" stop-color="${GOLD}" stop-opacity=".22"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0" cy="1" r="0.7"><stop offset="0" stop-color="#5680d6" stop-opacity=".35"/><stop offset="1" stop-color="#5680d6" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.3" fill="#fff" fill-opacity=".07"/></pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#g1)"/><rect width="${w}" height="${h}" fill="url(#g2)"/><rect width="${w}" height="${h}" fill="url(#dots)"/>`;

/** Lines of text; each line is [text, size, color, weight]. */
const lines = (x: number, y: number, rows: [string, number, string, number][], gap = 1.18) => {
  let cy = y;
  return rows.map(([t, s, c, wgt]) => { cy += s * gap; return `<text x="${x}" y="${cy}" font-family="${F}" font-size="${s}" font-weight="${wgt}" fill="${c}" letter-spacing="${s > 50 ? -1.5 : 0}">${esc(t)}</text>`; }).join("");
};
/** Wraps a sentence to about `n` characters per line. */
const wrap = (s: string, n: number) => s.split(" ").reduce<string[]>((a, w) => { const l = a[a.length - 1]; if (l !== undefined && (l + " " + w).length <= n) a[a.length - 1] = `${l} ${w}`; else a.push(w); return a; }, []);

const mark = (x: number, y: number, scale: number) => `<g transform="translate(${x} ${y}) scale(${scale})">${PAWID_MARK_BODY}</g>`;
const paw = (x: number, y: number, s: number, op = 1) => `<g transform="translate(${x} ${y}) scale(${s / 24})" color="${GOLD}" opacity="${op}">${ICON_BODIES.pawFill}</g>`;
const ring = (cx: number, cy: number, r: number, size: number) => Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
  return `<g transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)})">${paw(cx + Math.cos(a) * r - size / 2, cy + Math.sin(a) * r - size / 2, size, i % 2 ? 0.75 : 1)}</g>`;
}).join("");

const footer = (w: number, h: number, page?: string) => `
${mark(80, h - 132, 0.75)}
<text x="148" y="${h - 86}" font-family="${F}" font-size="30" font-weight="800" fill="#fff">PawID</text>
<text x="${w - 80}" y="${h - 86}" text-anchor="end" font-family="${F}" font-size="26" font-weight="600" fill="${MUTED}">${page ?? "pawid.hospet.eu/manifesto"}</text>`;

const kicker = (y: number, t: string) => `<text x="80" y="${y}" font-family="${F}" font-size="28" font-weight="800" fill="${GOLD}" letter-spacing="4">${esc(t.toUpperCase())}</text>`;
const W = 1080, H = 1350;

const slides: string[] = [
  // 1. Cover
  `${bg(W, H)}
  ${ring(540, 400, 190, 40)}
  ${mark(540 - 115, 400 - 115, 3.6)}
  ${kicker(740, "PawID manifesto")}
  ${lines(78, 760, [["Free and open source,", 76, "#fff", 800], ["for a pet friendly", 76, GOLD, 800], ["Europe.", 76, GOLD, 800]], 1.12)}
  ${lines(80, 1040, [["The EU is studying a digital pet passport.", 34, MUTED, 400], ["Vets, venues and owners can build it together.", 34, MUTED, 400]], 1.4)}
  <text x="${W - 80}" y="1150" text-anchor="end" font-family="${F}" font-size="28" font-weight="700" fill="#fff">Swipe  →</text>
  ${footer(W, H)}`,
  // 2. What the EU is doing
  `${bg(W, H)}
  ${kicker(150, "What the EU is doing")}
  ${lines(78, 170, [["Three changes,", 68, "#fff", 800], ["all decided in 2026.", 68, "#fff", 800]], 1.12)}
  ${[["22 Apr 2026", "New rules for travelling with pets. A new paper passport model, mandatory for passports issued from 2028."],
     ["17 Jun 2026", "First EU law on the welfare of dogs and cats: every dog and cat microchipped and registered, databases linked across the EU."],
     ["Until 2028", "The Commission studies a digital pet passport, including with the European Digital Identity Wallet."]]
    .map(([d, t], i) => { const y = 400 + i * 255; return `<rect x="80" y="${y}" width="920" height="225" rx="28" fill="#fff" fill-opacity=".07"/>
      <text x="120" y="${y + 62}" font-family="${F}" font-size="30" font-weight="800" fill="${GOLD}">${d}</text>${lines(120, y + 78, wrap(t!, 46).map((l) => [l, 32, "#fff", 500] as [string, number, string, number]), 1.32)}`; }).join("")}
  ${footer(W, H)}`,
  // 3. What is missing
  `${bg(W, H)}
  ${kicker(150, "What is missing")}
  ${lines(78, 170, [["A hotel cannot easily", 68, "#fff", 800], ["check a pet's papers.", 68, GOLD, 800]], 1.12)}
  ${["A way for venues to check a pet without taking the passport.", "One place for the travel rules, each with its official source.", "A vet's confirmation that travels with the owner.", "One tool for every country and language, owned by no company."]
    .map((t, i) => { const y = 420 + i * 175; return `${paw(80, y + 8, 46)}${lines(150, y - 6, wrap(t, 40).map((l) => [l, 34, "#fff", 500] as [string, number, string, number]), 1.32)}`; }).join("")}
  ${footer(W, H)}`,
  // 4. Build it with us
  `${bg(W, H)}
  ${kicker(150, "Build it with us")}
  ${lines(78, 170, [["Free, open source,", 68, "#fff", 800], ["built by the people", 68, "#fff", 800], ["who use it.", 68, GOLD, 800]], 1.12)}
  ${[["Vets", "confirm microchip and rabies vaccine"], ["Hotels and places", "check a pet with one scan"], ["Fact checkers", "confirm or correct the rules"], ["Translators and developers", "every language, open code"]]
    .map(([a, b], i) => { const y = 500 + i * 140; return `<rect x="80" y="${y}" width="920" height="116" rx="28" fill="#fff" fill-opacity=".07"/>
      <text x="120" y="${y + 50}" font-family="${F}" font-size="34" font-weight="800" fill="#fff">${esc(a!)}</text><text x="120" y="${y + 92}" font-family="${F}" font-size="28" fill="${MUTED}">${esc(b!)}</text>`; }).join("")}
  <rect x="80" y="1080" width="920" height="96" rx="48" fill="${GOLD}"/>
  <text x="540" y="1140" text-anchor="middle" font-family="${F}" font-size="34" font-weight="800" fill="#14233f">Read and share: pawid.hospet.eu/manifesto</text>
  ${footer(W, H, "Not an official document")}`,
];

const story = `${bg(1080, 1920)}
  ${ring(540, 560, 230, 48)}
  ${mark(540 - 140, 560 - 140, 4.375)}
  ${kicker(960, "PawID manifesto")}
  ${lines(78, 980, [["Free and open source,", 80, "#fff", 800], ["for a pet friendly", 80, GOLD, 800], ["Europe.", 80, GOLD, 800]], 1.12)}
  ${lines(80, 1280, [["The EU is studying a digital pet passport.", 36, MUTED, 400], ["Vets, venues and owners can build it together.", 36, MUTED, 400]], 1.4)}
  <rect x="80" y="1500" width="920" height="110" rx="55" fill="${GOLD}"/>
  <text x="540" y="1568" text-anchor="middle" font-family="${F}" font-size="38" font-weight="800" fill="#14233f">pawid.hospet.eu/manifesto</text>
  ${footer(1080, 1920, "Free · open source")}`;

for (const [i, s] of slides.entries()) {
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${dir}manifesto-${i + 1}.jpg`);
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${story}</svg>`)).jpeg({ quality: 88, mozjpeg: true }).toFile(`${dir}manifesto-story.jpg`);
console.log("instagram images written");

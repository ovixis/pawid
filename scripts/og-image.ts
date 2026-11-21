// The link preview picture for the manifesto (1200 x 630, Open Graph). Run: npx vite-node scripts/og-image.ts
import sharp from "sharp";
import { ICON_BODIES, PAWID_MARK_BODY } from "@pawid/ui";

const out = new URL("../apps/web/public/og/manifesto.png", import.meta.url).pathname;
const font = "Helvetica Neue, Helvetica, Arial, sans-serif";
// A ring of twelve gold paw prints around the PawID mark (not the EU emblem: PawID is not an EU project).
const stars = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
  const x = 945 + Math.cos(a) * 170, y = 315 + Math.sin(a) * 170;
  const rot = (a * 180) / Math.PI + 90;
  return `<g transform="translate(${(x - 16).toFixed(1)} ${(y - 16).toFixed(1)}) rotate(${rot.toFixed(0)} 16 16) scale(1.333)" color="#ffc629" opacity="${i % 2 ? 0.75 : 1}">${ICON_BODIES.pawFill}</g>`;
}).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22395f"/><stop offset="1" stop-color="#0c1629"/></linearGradient>
  <radialGradient id="g1" cx="0.85" cy="0.2" r="0.6"><stop offset="0" stop-color="#ffc629" stop-opacity=".22"/><stop offset="1" stop-color="#ffc629" stop-opacity="0"/></radialGradient>
  <radialGradient id="g2" cx="0.05" cy="1" r="0.7"><stop offset="0" stop-color="#5680d6" stop-opacity=".35"/><stop offset="1" stop-color="#5680d6" stop-opacity="0"/></radialGradient>
  <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#ffffff" fill-opacity=".07"/></pattern>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<rect width="1200" height="630" fill="url(#g1)"/>
<rect width="1200" height="630" fill="url(#g2)"/>
<rect width="1200" height="630" fill="url(#dots)"/>
${stars}
<g transform="translate(865 235) scale(2.5)">${PAWID_MARK_BODY}</g>
<text x="80" y="118" font-family="${font}" font-size="26" font-weight="700" fill="#ffc629" letter-spacing="3">PAWID MANIFESTO</text>
<text font-family="${font}" font-weight="800" fill="#ffffff" letter-spacing="-2">
  <tspan x="78" y="215" font-size="72">A pet friendly</tspan>
  <tspan x="78" y="297" font-size="72">Europe,</tspan>
  <tspan x="78" y="379" font-size="72" fill="#ffc629">built in the open.</tspan>
</text>
<text font-family="${font}" font-size="28" fill="#c7d3e8">
  <tspan x="80" y="460">The EU is studying a digital pet passport.</tspan>
  <tspan x="80" y="500">Vets, venues and owners can build it together.</tspan>
</text>
<text x="80" y="570" font-family="${font}" font-size="24" font-weight="700" fill="#ffffff">pawid.hospet.eu/manifesto</text>
</svg>`;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log("og image written");

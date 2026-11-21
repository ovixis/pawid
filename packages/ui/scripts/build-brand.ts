// Writes the brand files from src/brand.ts: npm run brand -w @pawid/ui
// apps/web/public/brand/*.svg, the favicon and the app icons (PNG via sharp).
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { HOSPET_MARK_SVG, PAWID_MARK_BODY, PAWID_MARK_SVG } from "../src/brand";

const pub = new URL("../../../apps/web/public/", import.meta.url).pathname;
writeFileSync(pub + "brand/pawid-mark.svg", PAWID_MARK_SVG + "\n");
writeFileSync(pub + "brand/hospet-mark.svg", HOSPET_MARK_SVG + "\n");
writeFileSync(pub + "icons/icon.svg", PAWID_MARK_SVG + "\n");

// Full-bleed square: the platform rounds the corners itself (iOS, Android launchers).
const square = (scale: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#14233f"/><g transform="translate(${32 - 32 * scale} ${32 - 32 * scale}) scale(${scale})">${PAWID_MARK_BODY}</g></svg>`;
const png = (svg: string, size: number, file: string) => sharp(Buffer.from(svg), { density: 1200 }).resize(size, size).png().toFile(pub + "icons/" + file);
await png(PAWID_MARK_SVG, 192, "icon-192.png");
await png(PAWID_MARK_SVG, 512, "icon-512.png");
await png(square(1), 180, "apple-touch-icon.png");
// Maskable: everything inside the 80% safe circle.
await png(square(0.82), 512, "icon-maskable-512.png");
console.log("brand files written");

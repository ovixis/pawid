import { ICON_BODIES, type IconName } from "./icon-map";

/** Escapes text for HTML content and attribute values. Use on every piece of user data. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Inline SVG from an icon body (I_paw…). Decorative unless a label is given. Keeps bundles small. */
export function svgOf(body: string, label?: string, cls = "pw-icon"): string {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : `aria-hidden="true"`;
  return `<svg class="${esc(cls)}" viewBox="0 0 24 24" ${a11y}>${body}</svg>`;
}

/** Inline SVG icon by name (Tabler Icons, MIT). Pulls in every icon: prefer svgOf in code that ships to venues. */
export function icon(name: IconName, label?: string, cls = "pw-icon"): string {
  return svgOf(ICON_BODIES[name], label, cls);
}

/** 1 March 2026 */
export function longDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

let regionNames: Intl.DisplayNames | null | undefined;
export function countryName(code: string | undefined): string | undefined {
  if (!code) return undefined;
  if (regionNames === undefined) {
    try { regionNames = new Intl.DisplayNames(["en"], { type: "region" }); } catch { regionNames = null; }
  }
  return regionNames?.of(code) ?? code;
}

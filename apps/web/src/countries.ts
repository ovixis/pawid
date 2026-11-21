import { countryName } from "@pawid/ui";

/** EU member states, then other European countries. Names come from the browser (Intl). */
const EU = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];
const OTHER = ["AD", "AL", "BA", "CH", "GB", "IS", "LI", "MC", "ME", "MK", "NO", "RS", "SM", "UA", "VA"];

const byName = (codes: string[]) => codes.map((c) => ({ code: c, name: countryName(c) ?? c })).sort((a, b) => a.name.localeCompare(b.name, "en"));
export const COUNTRY_GROUPS = [
  { label: "European Union", items: byName(EU) },
  { label: "Other countries in Europe", items: byName(OTHER) },
];

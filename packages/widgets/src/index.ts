/**
 * PawID components for venues. One script:
 *   <script type="module" src="https://pawid.hospet.eu/embed/v1.js"></script>
 * then any of: <pawid-scanner>, <pawid-policy>, <pawid-button>, <pawid-travel-check>.
 */
import { PawidButton } from "./button";
import { PawidPolicy } from "./policy";
import { PawidScanner } from "./scanner";
import { PawidTravelCheck } from "./travel";

const ELEMENTS: [string, CustomElementConstructor][] = [
  ["pawid-scanner", PawidScanner],
  ["pawid-policy", PawidPolicy],
  ["pawid-button", PawidButton],
  ["pawid-travel-check", PawidTravelCheck],
];

for (const [name, ctor] of ELEMENTS) {
  if (!customElements.get(name)) customElements.define(name, ctor);
}

export { PawidButton, PawidPolicy, PawidScanner, PawidTravelCheck };
export { readPolicy, type VenuePolicy } from "./policy";
export { tokenFrom } from "./scanner";

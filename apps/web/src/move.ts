// PawID moved from pawid.pages.dev to pawid.hospet.eu (21 November 2026).
// Pages on the old address send the visitor to the same page on the new one. The phone keeps data
// per address, so pets saved on the old address travel along in a restore link (after "#", never
// sent to a server); on the new address the owner taps Restore. Preview deployments
// (<id>.pawid.pages.dev) and the venue script (/embed/v1.js, not a page) are not moved.
import { loadOwnerName, loadPets } from "./storage";
import { encodeBackup, makeBackup } from "./backup";

export const HOME = "https://pawid.hospet.eu";
const OLD_HOST = "pawid.pages.dev";

/** True when the page is leaving for the new address: the caller should stop rendering. */
export function moveToNewAddress(): boolean {
  if (location.hostname !== OLD_HOST) return false;
  const pets = loadPets();
  if (pets.length && location.pathname === "/") {
    void encodeBackup(makeBackup(pets, loadOwnerName()))
      .then((code) => location.replace(`${HOME}/#/restore?moved=1&b=${code}`))
      .catch(() => location.replace(`${HOME}/${location.hash}`));
    return true;
  }
  location.replace(HOME + location.pathname + location.search + location.hash);
  return true;
}

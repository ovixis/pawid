import type { Pet } from "@pawid/core";
import { BY_HOSPET } from "@pawid/ui";
import { el, topBar, siteFooter } from "./dom";
import { loadOwnerName, loadPets, saveOwnerName, savePets } from "./storage";
import { injectStyles } from "./style";
import { cardView } from "./views/card";
import { backupCard, restoreView } from "./views/backup";
import { formView } from "./views/form";
import { homeView } from "./views/home";
import { shareView } from "./views/share";

// Where the verify page lives. Set VITE_VERIFY_BASE at build time for production.
const VERIFY_BASE: string = import.meta.env.VITE_VERIFY_BASE ?? "http://localhost:8787";

injectStyles();

let pets: Pet[] = loadPets();
const root = document.getElementById("app") as HTMLElement;

const header = topBar("#/", BY_HOSPET.href);
const main = el("main", { id: "main", tabIndex: -1 });
const footer = siteFooter();
root.replaceChildren(header, main, footer);

function savedVenue(): { venue?: string; days?: number } {
  try { return JSON.parse(sessionStorage.getItem("pawid.venue") ?? "{}") as { venue?: string; days?: number }; } catch { return {}; }
}

function save(p: Pet): void {
  const i = pets.findIndex((x) => x.id === p.id);
  pets = i >= 0 ? pets.map((x) => (x.id === p.id ? p : x)) : [...pets, p];
  savePets(pets);
  // Came from a venue's button with no pet yet: go straight on to showing it.
  const v = savedVenue();
  location.hash = i < 0 && v.venue ? `#/pet/${encodeURIComponent(p.id)}/share` : `#/pet/${encodeURIComponent(p.id)}`;
}

function restore(next: Pet[], owner?: string): void {
  pets = next;
  savePets(pets);
  if (owner && !loadOwnerName()) saveOwnerName(owner);
  // Drop the backup code from the address bar and the history entry.
  history.replaceState(null, "", "#/");
  route();
}

function remove(p: Pet): void {
  if (!confirm(`Delete ${p.name} from this device? This can't be undone.`)) return;
  pets = pets.filter((x) => x.id !== p.id);
  savePets(pets);
  location.hash = "#/";
}

/** Venue context from a venue's button: #/share?venue=Hotel%20X&days=7 (kept for this tab only). */
function venueContext(q: URLSearchParams): { venue?: string; days?: number } {
  const venue = (q.get("venue") ?? "").trim().slice(0, 100) || undefined;
  const days = q.get("days") === "7" ? 7 : undefined;
  return { venue, days };
}

function route(): void {
  const [path = "", query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  const q = new URLSearchParams(query);
  const ctx = venueContext(q);
  const parts = path.split("/").map(decodeURIComponent);
  if (parts[0] === "share") {
    try { sessionStorage.setItem("pawid.venue", JSON.stringify(ctx)); } catch { /* private mode */ }
    if (pets.length === 1) { location.replace(`#/pet/${encodeURIComponent(pets[0]!.id)}/share?${query}`); return; }
    if (pets.length === 0) { location.replace(`#/pet/new?${query}`); return; }
  }
  const pet = parts[0] === "pet" && parts[1] !== "new" ? pets.find((p) => p.id === parts[1]) : undefined;
  let view: Node[];
  let title = "PawID";
  if (parts[0] === "pet" && parts[1] === "new") { view = formView(undefined, save); title = "Add your pet, PawID"; }
  else if (pet && parts[2] === "edit") { view = formView(pet, save, () => remove(pet)); title = `Edit ${pet.name}, PawID`; }
  else if (pet && parts[2] === "share") { view = shareView(pet, loadOwnerName(), VERIFY_BASE, ctx.venue || ctx.days ? ctx : savedVenue()); title = `Show ${pet.name}, PawID`; }
  else if (pet) { view = cardView(pet, loadOwnerName()); title = `${pet.name}, PawID`; }
  else if (parts[0] === "share") { view = homeView(pets, ctx.venue, query); title = "Choose a pet, PawID"; }
  else if (parts[0] === "restore") { view = restoreView(q.get("b"), pets, restore); title = "Restore a backup, PawID"; }
  else {
    view = homeView(pets);
    view.push(pets.length ? backupCard(pets, loadOwnerName()) : el("p", { class: "restore-cta" }, "New phone? ", el("a", { href: "#/restore", class: "pw-link" }, "Restore a backup")));
  }
  document.title = title;
  main.replaceChildren(...view);
  if (document.activeElement !== document.body) main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

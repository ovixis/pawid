import type { Pet } from "@pawid/core";
import { BY_HOSPET } from "@pawid/ui";
import { el, svg } from "./dom";
import { loadOwnerName, loadPets, savePets } from "./storage";
import { injectStyles } from "./style";
import { cardView } from "./views/card";
import { formView } from "./views/form";
import { homeView } from "./views/home";
import { shareView } from "./views/share";

// Where the verify page lives. Set VITE_VERIFY_BASE at build time for production.
const VERIFY_BASE: string = import.meta.env.VITE_VERIFY_BASE ?? "http://localhost:8787";

injectStyles();

let pets: Pet[] = loadPets();
const root = document.getElementById("app") as HTMLElement;

const header = el(
  "header",
  { class: "top" },
  el("div", { class: "top-in" },
    el("a", { href: "#/", class: "logo" }, el("span", { class: "logo-mark" }, svg("pawFill")), "PawID"),
    el("a", { href: BY_HOSPET.href, class: "by", rel: "noopener" }, "by HosPet.eu"),
  ),
);
const main = el("main", { id: "main", tabIndex: -1 });
const footer = el("footer", { class: "foot" }, "Open source. Not an official document. ", el("a", { href: "https://github.com/ovixis/pawid", rel: "noopener" }, "Source code"), ". ", el("a", { href: BY_HOSPET.href, rel: "noopener" }, BY_HOSPET.text), ".");
root.replaceChildren(header, main, footer);

function save(p: Pet): void {
  const i = pets.findIndex((x) => x.id === p.id);
  pets = i >= 0 ? pets.map((x) => (x.id === p.id ? p : x)) : [...pets, p];
  savePets(pets);
  location.hash = `#/pet/${encodeURIComponent(p.id)}`;
}

function remove(p: Pet): void {
  if (!confirm(`Delete ${p.name} from this device? This can't be undone.`)) return;
  pets = pets.filter((x) => x.id !== p.id);
  savePets(pets);
  location.hash = "#/";
}

function route(): void {
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const pet = parts[0] === "pet" && parts[1] !== "new" ? pets.find((p) => p.id === parts[1]) : undefined;
  let view: Node[];
  let title = "PawID";
  if (parts[0] === "pet" && parts[1] === "new") { view = formView(undefined, save); title = "Add your pet, PawID"; }
  else if (pet && parts[2] === "edit") { view = formView(pet, save, () => remove(pet)); title = `Edit ${pet.name}, PawID`; }
  else if (pet && parts[2] === "share") { view = shareView(pet, loadOwnerName(), VERIFY_BASE); title = `Show ${pet.name}, PawID`; }
  else if (pet) { view = cardView(pet, loadOwnerName()); title = `${pet.name}, PawID`; }
  else { view = homeView(pets); }
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

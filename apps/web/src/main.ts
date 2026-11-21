import QRCode from "qrcode";
import {
  checkRabies,
  createShareToken,
  dogSchema,
  generateOwnerKeys,
  latestRabies,
  type Dog,
} from "@pawid/core";
import { loadDogs, loadOrCreateKeys, saveDogs } from "./storage";
import "./style.css";

// Where the verify page lives. Set VITE_VERIFY_BASE at build time for production.
const VERIFY_BASE: string = import.meta.env.VITE_VERIFY_BASE ?? "http://localhost:8787";

const app = document.getElementById("app") as HTMLElement;
let dogs: Dog[] = loadDogs();

const today = () => new Date().toISOString().slice(0, 10);

/** Small helper: build elements with textContent only, never innerHTML with user data. */
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: cls, ...rest } = props;
  if (cls) node.className = cls;
  Object.assign(node, rest);
  for (const c of children) node.append(c);
  return node;
}

const STATUS_TEXT = {
  valid: "Rabies vaccine valid",
  expiring_soon: "Rabies vaccine expires soon",
  expired: "Rabies vaccine expired",
  missing: "No rabies vaccine entered",
} as const;

function render(): void {
  app.replaceChildren(
    el("h1", {}, "PawID"),
    el(
      "p",
      { class: "note" },
      "Not an official document. It does not replace the paper EU pet passport. Data stays on this device.",
    ),
    ...dogs.map(dogCard),
    addDogForm(),
  );
}

function dogCard(dog: Dog): HTMLElement {
  const rabies = checkRabies(dog, today());
  const v = latestRabies(dog);
  const qrBox = el("div", { class: "qr" });

  const share = el("button", { type: "button" }, "Show QR for a hotel");
  share.onclick = async () => {
    const keys = await loadOrCreateKeys(generateOwnerKeys);
    const token = await createShareToken(
      { name: dog.name, microchip: dog.microchip, rabiesValidUntil: v?.validUntil },
      keys,
      { nowSec: Math.floor(Date.now() / 1000), ttlSec: 15 * 60 },
    );
    const url = `${VERIFY_BASE}/v/${token}`;
    const canvas = el("canvas");
    await QRCode.toCanvas(canvas, url, { width: 280, margin: 1 });
    qrBox.replaceChildren(canvas, el("p", { class: "note" }, "Valid for 15 minutes."));
  };

  const del = el("button", { type: "button", class: "ghost" }, "Delete");
  del.onclick = () => {
    if (!confirm(`Delete ${dog.name} from this device?`)) return;
    dogs = dogs.filter((d) => d.id !== dog.id);
    saveDogs(dogs);
    render();
  };

  return el(
    "section",
    { class: `card ${rabies.status}` },
    el("h2", {}, dog.name),
    el("p", {}, `Microchip ${dog.microchip}`),
    el(
      "p",
      { class: "status" },
      STATUS_TEXT[rabies.status],
      rabies.validUntil ? ` (until ${rabies.validUntil})` : "",
    ),
    el("div", { class: "row" }, share, del),
    qrBox,
  );
}

function addDogForm(): HTMLElement {
  const form = el("form", { class: "card" });
  const name = el("input", { required: true, placeholder: "Dog name" });
  const chip = el("input", { required: true, placeholder: "Microchip (15 digits)", inputMode: "numeric" });
  const given = el("input", { type: "date" });
  const until = el("input", { type: "date" });
  const err = el("p", { class: "error" });

  form.append(
    el("h2", {}, "Add a dog"),
    name,
    chip,
    el("label", {}, "Rabies vaccine given on (optional)"),
    given,
    el("label", {}, "Rabies vaccine valid until (optional)"),
    until,
    err,
    el("button", { type: "submit" }, "Save"),
  );
  form.onsubmit = (e) => {
    e.preventDefault();
    if (Boolean(given.value) !== Boolean(until.value)) {
      err.textContent = "Fill both rabies dates, or leave both empty.";
      return;
    }
    const candidate = {
      id: crypto.randomUUID(),
      name: name.value.trim(),
      microchip: chip.value.replace(/\s/g, ""),
      vaccinations: until.value
        ? [{ kind: "rabies" as const, administeredOn: given.value, validUntil: until.value }]
        : [],
    };
    const parsed = dogSchema.safeParse(candidate);
    if (!parsed.success) {
      err.textContent = parsed.error.issues[0]?.message ?? "Invalid data";
      return;
    }
    dogs = [...dogs, parsed.data];
    saveDogs(dogs);
    render();
  };
  return form;
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

render();

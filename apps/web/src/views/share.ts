import QRCode from "qrcode";
import { createShareToken, generateOwnerKeys, shareCardFrom, type Pet } from "@pawid/core";
import { button, el, svg } from "../dom";
import { loadOrCreateKeys, saveOwnerName } from "../storage";

type Part = "identity" | "passport" | "rabies" | "vet" | "notes";

const PARTS: { key: Part; title: string; text: (p: Pet) => string; on: boolean; has: (p: Pet) => boolean }[] = [
  { key: "identity", title: "Microchip and description", text: () => "Chip number, breed, sex, weight, birth date.", on: true, has: (p) => Boolean(p.microchip || p.breed || p.birthDate) },
  { key: "rabies", title: "Rabies vaccine", text: () => "Dates and whether it is valid today.", on: true, has: (p) => p.vaccinations.some((v) => v.kind === "rabies") },
  { key: "passport", title: "Passport number and home country", text: () => "Some hotels ask for it at check-in.", on: false, has: (p) => Boolean(p.passportNumber || p.homeCountry || p.chipDate) },
  { key: "vet", title: "Your vet", text: () => "Name and phone, in case of an emergency.", on: false, has: (p) => Boolean(p.vet?.name || p.vet?.phone) },
  { key: "notes", title: "Your notes", text: (p) => (p.notes ? `"${p.notes.slice(0, 60)}${p.notes.length > 60 ? "…" : ""}"` : ""), on: false, has: (p) => Boolean(p.notes) },
];

const DURATIONS = [
  { sec: 15 * 60, title: "15 minutes", text: "To show at the desk or the table now." },
  { sec: 7 * 86_400, title: "7 days", text: "To send to the place before you arrive." },
];

export function shareView(pet: Pet, owner: string, verifyBase: string): Node[] {
  const id = encodeURIComponent(pet.id);
  const result = el("div", { class: "qr-wrap", attrs: { "aria-live": "polite" } });

  const picks = el("fieldset", { class: "pw-card pw-card-pad" }, el("legend", { class: "pw-card-head" }, el("h2", {}, "What the venue sees")));
  picks.append(el("p", { class: "pw-hint lead" }, `${pet.name}'s name and whether ${pet.species === "cat" ? "it is a cat" : "it is a dog"} are always on it.`));
  for (const part of PARTS.filter((x) => x.has(pet))) {
    picks.append(el("label", { class: "check" }, el("input", { type: "checkbox", name: part.key, checked: part.on }), el("span", {}, el("b", {}, part.title), el("span", {}, part.text(pet)))));
  }
  const ownerInput = el("input", { name: "owner", value: owner, maxLength: 60, autocomplete: "given-name", id: "f-owner", class: "pw-input" });
  picks.append(el("div", { class: "mt" }, el("label", { class: "pw-label", htmlFor: "f-owner" }, "Your first name (optional)"), ownerInput));

  const dur = el("fieldset", { class: "pw-card pw-card-pad" }, el("legend", { class: "pw-card-head" }, el("h2", {}, "For how long")));
  DURATIONS.forEach((d, i) => dur.append(el("label", { class: "check" }, el("input", { type: "radio", name: "ttl", value: String(d.sec), checked: i === 0 }), el("span", {}, el("b", {}, d.title), el("span", {}, d.text)))));

  const make = button("Make the code", { kind: "primary", icon: "qr" });
  const form = el("form", { class: "no-print stack" }, picks, dur, el("div", { class: "bar" }, make));

  form.addEventListener("submit", (e) => e.preventDefault());
  make.addEventListener("click", async () => {
    make.setAttribute("aria-busy", "true");
    make.disabled = true;
    try {
      const pick = Object.fromEntries(PARTS.map((p) => [p.key, (form.elements.namedItem(p.key) as HTMLInputElement | null)?.checked ?? false]));
      const name = ownerInput.value.trim();
      saveOwnerName(name);
      const ttl = Number((form.querySelector<HTMLInputElement>('input[name="ttl"]:checked')?.value) ?? 900);
      const keys = await loadOrCreateKeys(() => generateOwnerKeys());
      const token = await createShareToken(shareCardFrom(pet, pick, name || undefined), keys, { nowSec: Math.floor(Date.now() / 1000), ttlSec: ttl });
      const url = `${verifyBase}/v/${token}`;
      const canvas = el("canvas", { attrs: { role: "img", "aria-label": `QR code with ${pet.name}'s card` } });
      await QRCode.toCanvas(canvas, url, { width: 320, margin: 1, errorCorrectionLevel: "L" });
      const copy = button("Copy link", { icon: "copy", onClick: async () => {
        try { await navigator.clipboard.writeText(url); copy.lastChild!.textContent = "Copied"; } catch { prompt("Copy this link", url); }
      } });
      const actions = el("div", { class: "bar" }, copy);
      if ("share" in navigator) actions.prepend(button("Send", { kind: "dark", icon: "share", onClick: () => navigator.share({ title: `${pet.name}, PawID pet card`, url }).catch(() => {}) }));
      actions.append(el("a", { href: url, target: "_blank", rel: "noopener", class: "pw-btn pw-btn-ghost" }, "See what they see", svg("external")));
      result.replaceChildren(
        el("section", { class: "pw-card pw-card-pad qr-wrap" },
          el("h2", { class: "page-title small" }, "Show this to the venue"),
          canvas,
          el("p", { class: "pw-hint flush" }, ttl <= 3600 ? "The code works for 15 minutes. Staff scan it with any phone camera, no app or account." : "The link works for 7 days. Anyone who has it can see these details until then."),
          actions,
        ),
      );
      result.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    } finally {
      make.removeAttribute("aria-busy");
      make.disabled = false;
    }
  });

  return [
    el("div", { class: "bar no-print" }, el("a", { href: `#/pet/${id}`, class: "back" }, svg("back"), pet.name)),
    el("h1", { class: "page-title" }, `Show ${pet.name} to a venue`),
    form,
    result,
  ];
}

import { checkRabies, type Pet } from "@pawid/core";
import { button, el, link, today } from "../dom";

const STATUS: Record<string, [string, string]> = {
  valid: ["Rabies vaccine valid", "pw-status-ok"],
  expiring_soon: ["Rabies vaccine expires soon", "pw-status-warn"],
  expired: ["Rabies vaccine expired", "pw-status-no"],
  missing: ["No rabies vaccine entered", "pw-status-navy"],
};

export const petImg = (p: Pick<Pet, "species">) => el("img", { src: `/3d/${p.species === "cat" ? "cat" : "dog"}.webp`, alt: "", width: 64, height: 64 });

export function subline(p: Pet): string {
  return [p.species === "cat" ? "Cat" : "Dog", p.breed, p.sex ? (p.sex === "female" ? "Female" : "Male") : null, p.weightKg ? `${p.weightKg} kg` : null].filter(Boolean).join(", ");
}

export function homeView(pets: Pet[], venue?: string, query = ""): Node[] {
  const hero = el(
    "section",
    { class: "hero" },
    el("p", { class: "pw-eyebrow" }, "Free, open source, no account"),
    el("h1", {}, "Your pet's papers, ", el("em", {}, "ready at the door.")),
    el("p", {}, "Keep the pet passport details on your phone, put the rabies vaccine date in your phone's calendar with an alarm, and show a signed code to hotels, restaurants and places that welcome pets."),
  );
  const notice = el("p", { class: "pw-notice" }, "Not an official document. It does not replace the paper EU pet passport, which is issued by an authorised vet. Your data stays on this device.");

  if (!pets.length) {
    return [
      hero,
      el(
        "section",
        { class: "pw-card empty" },
        el("img", { src: "/3d/paw.webp", alt: "", width: 72, height: 72 }),
        el("h2", {}, "Add your pet"),
        el("p", {}, "Copy the details from the pet passport: microchip, rabies vaccine and your vet. It takes two minutes."),
        link("Add your pet", "#/pet/new", "primary", "add"),
      ),
      notice,
    ];
  }

  const list = el("section", { class: "pets", attrs: { "aria-label": "Your pets" } });
  for (const p of pets) {
    const r = checkRabies(p, today());
    const [label, cls] = STATUS[r.status]!;
    list.append(
      el(
        "article",
        { class: "pw-card pet" },
        petImg(p),
        el("h2", {}, el("a", { href: `#/pet/${encodeURIComponent(p.id)}` }, p.name)),
        el("p", { class: "pet-sub" }, subline(p), el("span", { class: `pw-status ${cls}` }, label)),
        el("div", { class: "pet-actions" }, link(venue ? `Show ${p.name}` : "Show to a venue", `#/pet/${encodeURIComponent(p.id)}/share${query ? `?${query}` : ""}`, "primary", "qr"), venue ? null : link("Card", `#/pet/${encodeURIComponent(p.id)}`, "secondary")),
      ),
    );
  }
  return [
    el("div", { class: "bar" }, el("h1", { class: "page-title grow" }, venue ? `Which pet is coming to ${venue}?` : pets.length === 1 ? "Your pet" : "Your pets"), button("Add a pet", { icon: "add", sm: true, onClick: () => (location.hash = "#/pet/new") })),
    list,
    notice,
  ];
}

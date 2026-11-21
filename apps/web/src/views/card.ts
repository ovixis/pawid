import { shareCardFrom, type Pet } from "@pawid/core";
import { petCardHtml } from "@pawid/ui";
import { button, el, link, svg, today } from "../dom";

export function cardView(pet: Pet, owner: string): Node[] {
  const holder = el("div");
  // petCardHtml escapes every value (packages/ui/src/card.ts, tested in card.test.ts).
  holder.innerHTML = petCardHtml(
    { ...shareCardFrom(pet, { identity: true, passport: true, rabies: true, vet: true, notes: true }, owner || undefined) },
    { todayIso: today(), imageSrc: `/3d/${pet.species === "cat" ? "cat" : "dog"}.webp`, footer: "Your own copy. Typed in by you from the pet passport. Not an official document." },
  );
  const id = encodeURIComponent(pet.id);
  return [
    el("div", { class: "bar no-print" }, el("a", { href: "#/", class: "back" }, svg("back"), "Your pets")),
    holder,
    el(
      "div",
      { class: "bar no-print" },
      link("Show to a venue", `#/pet/${id}/share`, "primary", "qr"),
      link("Edit", `#/pet/${id}/edit`, "secondary", "edit"),
      button("Print", { kind: "ghost", icon: "print", onClick: () => window.print() }),
    ),
  ];
}

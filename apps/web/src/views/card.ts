import { shareCardFrom, type Pet } from "@pawid/core";
import { longDate, petCardHtml } from "@pawid/ui";
import { loadSticker } from "../sticker";
import { vetState, vetStatusCard } from "./vetask";
import { googleCalendarUrl, nextRabiesExpiry, openIcs, rabiesReminderIcs } from "../calendar";
import { button, el, link, svg, today } from "../dom";

export function cardView(pet: Pet, owner: string): Node[] {
  const holder = el("div");
  // petCardHtml escapes every value (packages/ui/src/card.ts, tested in card.test.ts).
  holder.innerHTML = petCardHtml(
    { ...shareCardFrom(pet, { identity: true, passport: true, rabies: true, vet: true, notes: true }, owner || undefined) },
    { vet: vetState(pet) === "confirmed" && pet.vetConfirmation ? { status: "confirmed", name: pet.vetConfirmation.vet.name, registerBody: pet.vetConfirmation.vet.registerBody, registerNumber: pet.vetConfirmation.vet.registerNumber, on: new Date(pet.vetConfirmation.seal.t * 1000).toISOString().slice(0, 10) } : undefined, todayIso: today(), imageSrc: `/3d/${pet.species === "cat" ? "cat" : "dog"}.webp`, footer: "Your own copy. Typed in by you from the pet passport. Not an official document." },
  );
  const id = encodeURIComponent(pet.id);
  // Reminder in the phone's calendar, made on this device (no email, no server).
  const until = nextRabiesExpiry(pet, today());
  const reminder = until
    ? el("section", { class: "pw-card pw-card-pad reminder no-print", attrs: { "aria-labelledby": "rem-title" } },
        el("div", { class: "pw-card-head" }, el("h2", { id: "rem-title" }, "Reminder")),
        el("p", { class: "pw-hint lead" }, `The rabies vaccine is valid until ${longDate(until)}. Put it in your calendar: it rings 30 days, 7 days and 1 day before, at 9:00, even when PawID is closed.`),
        el("div", { class: "bar" },
          button("Add to my calendar", { kind: "primary", icon: "calendar", onClick: () => openIcs(rabiesReminderIcs(pet, until, longDate(until)!), `${pet.name.replace(/[^\p{L}\p{N}-]+/gu, "-")}-rabies-reminder.ics`) }),
          el("a", { href: googleCalendarUrl(pet, until, longDate(until)!), target: "_blank", rel: "noopener", class: "pw-btn pw-btn-ghost" }, "Google Calendar", svg("external")),
        ),
        el("p", { class: "pw-hint flush" }, "Changed the dates after a vet visit? Add it again: the calendar updates the same event."),
      )
    : null;
  const stickerSrc = loadSticker(pet.id);
  const stickerFig = stickerSrc
    ? el("figure", { class: "pw-card pw-card-pad sticker-fig" },
        el("figcaption", {}, el("b", {}, "Rabies vaccine sticker"), el("span", {}, "Your photo from the passport")),
        el("img", { src: stickerSrc, alt: `Photo of ${pet.name}'s rabies vaccine sticker in the passport` }),
      )
    : null;
  return [
    el("div", { class: "bar no-print" }, el("a", { href: "#/", class: "back" }, svg("back"), "Your pets")),
    holder,
    ...(stickerFig ? [stickerFig] : []),
    vetStatusCard(pet),
    ...(reminder ? [reminder] : []),
    el(
      "div",
      { class: "bar no-print" },
      link("Show to a venue", `#/pet/${id}/share`, "primary", "qr"),
      link("Can I travel?", `#/travel?pet=${id}`, "secondary", "world"),
      link("Edit", `#/pet/${id}/edit`, "secondary", "edit"),
      button("Print", { kind: "ghost", icon: "print", onClick: () => window.print() }),
    ),
  ];
}

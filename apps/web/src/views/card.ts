import { shareCardFrom, type Pet } from "@pawid/core";
import { longDate, petCardHtml } from "@pawid/ui";
import { loadSticker } from "../sticker";
import { vetState, vetStatusCard } from "./vetask";
import { googleCalendarUrl, nextRabiesExpiry, openIcs, rabiesReminderIcs } from "../calendar";
import { button, el, link, svg, today } from "../dom";
import { activeCodes, stopCode } from "../shares";

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
  // Codes still working, made on this phone: the owner can stop any of them.
  const codes = activeCodes(pet.id);
  const codesCard = codes.length
    ? el("section", { class: "pw-card pw-card-pad no-print", attrs: { "aria-labelledby": "codes-title" } },
        el("div", { class: "pw-card-head" }, el("h2", { id: "codes-title" }, codes.length === 1 ? "1 code still working" : `${codes.length} codes still working`)),
        el("ul", { class: "codes" }, ...codes.map((c) => {
          const msg = el("span", { attrs: { role: "status" } });
          const until = new Date(c.exp * 1000);
          const row = el("li", {},
            el("span", {}, el("b", {}, c.exp - c.made <= 3600 ? "15 minute code" : "7 day link"), ` until ${until.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`, msg),
            button("Stop", { kind: "ghost", sm: true, icon: "closeCircle", onClick: async () => {
              try { await stopCode(c.token); row.replaceChildren(el("span", {}, el("b", {}, "Stopped. "), "It no longer works for anyone.")); }
              catch (x) { msg.textContent = ` ${(x as Error).message}`; }
            } }),
          );
          return row;
        })),
        el("p", { class: "pw-hint flush" }, "Sent a link to the wrong place, or changed your mind? Stop it: it stops working at once."),
      )
    : null;
  return [
    el("div", { class: "bar no-print" }, el("a", { href: "#/", class: "back" }, svg("back"), "Your pets")),
    holder,
    ...(stickerFig ? [stickerFig] : []),
    vetStatusCard(pet),
    ...(codesCard ? [codesCard] : []),
    ...(reminder ? [reminder] : []),
    el(
      "div",
      { class: "bar no-print" },
      link("Show to a venue", `#/pet/${id}/share`, "primary", "qr"),
      link("Can I travel?", `#/travel?pet=${id}`, "secondary", "world"),
      link("Vaccine plan", `#/pet/${id}/vaccines`, "secondary", "vaccine"),
      link("Edit", `#/pet/${id}/edit`, "secondary", "edit"),
      button("Print", { kind: "ghost", icon: "print", onClick: () => window.print() }),
    ),
  ];
}

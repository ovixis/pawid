// Owner side of the vet confirmation: the status on the pet card, and the "ask your vet" screen.
import QRCode from "qrcode";
import { sameVetFields, verifyVetSeal, vetConfirmationSchema, type Pet, type VetConfirmation, type VetFields } from "@pawid/core";
import { longDate } from "@pawid/ui";
import { el, link, svg } from "../dom";
import { newRequest, pickUp, requestUrl, type VetRequest } from "../relay";

/** The values a vet would confirm, as the owner entered them now. */
export function currentVetFields(pet: Pet): Partial<VetFields> {
  const r = pet.vaccinations.filter((v) => v.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
  return { species: pet.species, microchip: pet.microchip, rabiesGivenOn: r?.administeredOn, rabiesValidUntil: r?.validUntil, rabiesVaccine: r?.product };
}

/** confirmed: the vet's values are still the pet's values. changed: the owner edited them since. */
export function vetState(pet: Pet): "none" | "confirmed" | "changed" {
  if (!pet.vetConfirmation) return "none";
  return sameVetFields(pet.vetConfirmation.fields, currentVetFields(pet)) ? "confirmed" : "changed";
}

const vetLine = (c: VetConfirmation) =>
  `${c.vet.name}${c.vet.registerBody ? `, ${c.vet.registerBody}` : ""}${c.vet.registerNumber ? ` n. ${c.vet.registerNumber}` : ""}, on ${longDate(new Date(c.seal.t * 1000).toISOString().slice(0, 10))}`;

/** Card on the pet page. */
export function vetStatusCard(pet: Pet): HTMLElement {
  const id = encodeURIComponent(pet.id);
  const state = vetState(pet);
  const f = currentVetFields(pet);
  const ready = Boolean(f.microchip && f.rabiesValidUntil);
  const body: Node[] = [];
  if (state === "confirmed") {
    body.push(el("p", { class: "vet-ok" }, svg("checkCircleFill"), el("span", {}, el("b", {}, "Confirmed by a vet. "), `Microchip and rabies vaccine confirmed by ${vetLine(pet.vetConfirmation!)}. Venues see it on the codes you share.`)));
  } else if (state === "changed") {
    body.push(el("p", { class: "pw-notice" }, "You changed the microchip or rabies details after your vet confirmed them, so the confirmation no longer shows. Ask your vet to confirm again."));
  } else {
    body.push(el("p", { class: "pw-hint lead" }, "Your vet checks the microchip and rabies vaccine against the passport and confirms them on their phone. Then hotels and venues see \"confirmed by a vet\", not just \"declared by the owner\"."));
  }
  if (!ready) body.push(el("p", { class: "pw-hint flush" }, "Add the microchip number and the rabies vaccine dates first."));
  else if (state !== "confirmed") body.push(el("div", { class: "bar" }, link("Ask my vet to confirm", `#/pet/${id}/vet`, "primary", "certificate")));
  else body.push(el("div", { class: "bar" }, link("Confirm again", `#/pet/${id}/vet`, "ghost")));
  return el("section", { class: "pw-card pw-card-pad no-print vet-card", attrs: { "aria-labelledby": "vet-title" } },
    el("div", { class: "pw-card-head" }, el("h2", { id: "vet-title" }, "Vet confirmation")), ...body);
}

const KEY = (petId: string) => `pawid.vetreq.v1.${petId}`;

/** #/pet/<id>/vet: QR for the vet, then waits for the confirmation. */
export function vetAskView(pet: Pet, onConfirmed: (p: Pet) => void): Node[] {
  const id = encodeURIComponent(pet.id);
  const f = currentVetFields(pet);
  // Keep the same request while this tab is open, so a reload keeps waiting for the same answer.
  let req: VetRequest | null = null;
  try { req = JSON.parse(sessionStorage.getItem(KEY(pet.id)) ?? "null") as VetRequest | null; } catch { /* none */ }
  if (!req) {
    req = newRequest({ n: pet.name, s: pet.species, c: f.microchip, rg: f.rabiesGivenOn, ru: f.rabiesValidUntil, rv: f.rabiesVaccine });
    try { sessionStorage.setItem(KEY(pet.id), JSON.stringify(req)); } catch { /* private mode */ }
  }
  const url = requestUrl(location.origin, req);
  const canvas = el("canvas", { attrs: { role: "img", "aria-label": "QR code for your vet" } });
  void QRCode.toCanvas(canvas, url, { width: 300, margin: 1, errorCorrectionLevel: "M" });
  const status = el("p", { class: "vet-wait", attrs: { role: "status" } }, el("span", { class: "vet-dot", attrs: { "aria-hidden": "true" } }), "Waiting for your vet…");

  const stopAt = Date.now() + 30 * 60_000;
  const here = location.hash;
  const ctrl = new AbortController();
  const poll = async () => {
    if (location.hash !== here) { ctrl.abort(); return; }
    if (Date.now() > stopAt) { status.textContent = "Stopped waiting after 30 minutes. Open this page again to make a new code."; sessionStorage.removeItem(KEY(pet.id)); return; }
    try {
      const got = await pickUp(req!, ctrl.signal);
      if (got) return void (await accept(got));
    } catch { /* offline for a moment: try again */ }
    setTimeout(poll, 3000);
  };
  const accept = async (got: unknown) => {
    const c = vetConfirmationSchema.safeParse(got);
    if (!c.success || !(await verifyVetSeal(c.data.seal, c.data.fields))) {
      status.textContent = "The answer could not be checked. Ask your vet to confirm again.";
      return;
    }
    sessionStorage.removeItem(KEY(pet.id));
    const v = c.data.fields;
    // The vet's values win: they read them in the passport.
    const others = pet.vaccinations.filter((x) => x.kind !== "rabies");
    const rabies = pet.vaccinations.filter((x) => x.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil));
    const latest = { ...(rabies[0] ?? { kind: "rabies" as const }), kind: "rabies" as const, administeredOn: v.rabiesGivenOn, validUntil: v.rabiesValidUntil, product: v.rabiesVaccine };
    onConfirmed({ ...pet, species: v.species, microchip: v.microchip, vaccinations: [...others, ...rabies.slice(1), latest], vetConfirmation: c.data });
  };
  setTimeout(poll, 2000);

  return [
    el("div", { class: "bar no-print" }, el("a", { href: `#/pet/${id}`, class: "back" }, svg("back"), pet.name)),
    el("h1", { class: "page-title" }, "Ask your vet to confirm"),
    el("section", { class: "pw-card pw-card-pad qr-wrap" },
      el("p", { class: "pw-hint flush" }, "Show this code to your vet with the pet passport. They scan it with their phone camera, check the microchip and the rabies vaccine, and confirm with their fingerprint."),
      canvas,
      status,
      el("p", { class: "pw-hint flush" }, "Your vet needs to register with PawID once (two minutes). If they correct a date, your pet's details are updated."),
    ),
  ];
}

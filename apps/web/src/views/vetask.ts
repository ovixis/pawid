// Owner side of the vet confirmation: the status on the pet card, and the "ask your vet" screen.
import QRCode from "qrcode";
import {
  exportPairKeys, importPairKeys, newPairKeys, pairDecrypt, pairEncrypt, pairNumber, sameVetFields, verifyVetSeal, vetConfirmationSchema,
  type PairKeys, type Pet, type VetConfirmation, type VetFields,
} from "@pawid/core";
import { longDate } from "@pawid/ui";
import { button, el, link, svg } from "../dom";
import { PairGone, createPair, ownerDecide, ownerPoll, spaced, type VetPublic } from "../pair";

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

const KEY = (petId: string) => `pawid.pair.v1.${petId}`;
interface Saved { id: string; code: string; ownerToken: string; expires: number; jwk: JsonWebKey }

async function startPair(petId: string): Promise<{ s: Saved; keys: PairKeys }> {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY(petId)) ?? "null") as Saved | null;
    if (s && s.expires * 1000 > Date.now() + 60_000) return { s, keys: await importPairKeys(s.jwk) };
  } catch { /* start again */ }
  const keys = await newPairKeys();
  const r = await createPair(keys.publicRaw);
  const s: Saved = { ...r, jwk: await exportPairKeys(keys) };
  try { sessionStorage.setItem(KEY(petId), JSON.stringify(s)); } catch { /* private mode */ }
  return { s, keys };
}

const vetWho = (v?: VetPublic) => v ? [v.name, [v.registerBody, v.registerNumber ? `n. ${v.registerNumber}` : ""].filter(Boolean).join(" "), v.clinic].filter(Boolean).join(", ") : "A vet";

/** #/pet/<id>/vet: a 6 digit code (and its QR) for the vet; then the same number on both phones. */
export function vetAskView(pet: Pet, onConfirmed: (p: Pet) => void): Node[] {
  const id = encodeURIComponent(pet.id);
  const box = el("section", { class: "pw-card pw-card-pad pair-box", attrs: { "aria-live": "polite" } }, el("p", { class: "vet-wait" }, el("span", { class: "vet-dot" }), "Making a code…"));
  const here = location.hash;
  const alive = () => location.hash === here;
  const forget = () => { try { sessionStorage.removeItem(KEY(pet.id)); } catch { /* none */ } };
  const again = () => button("Make a new code", { kind: "secondary", onClick: () => { forget(); location.reload(); } });
  const gone = (msg = "This code expired.") => box.replaceChildren(el("p", { class: "pw-notice" }, msg), el("div", { class: "bar" }, again()));

  const run = async () => {
    let s: Saved, keys: PairKeys;
    try { ({ s, keys } = await startPair(pet.id)); } catch (x) { return gone(`Could not make a code: ${(x as Error).message}`); }
    const url = `${location.origin}/vet#/pair?c=${s.code}`;
    const canvas = el("canvas", { attrs: { role: "img", "aria-label": `QR code with the code ${spaced(s.code)}` } });
    void QRCode.toCanvas(canvas, url, { width: 220, margin: 1, errorCorrectionLevel: "M" });
    const until = new Date(s.expires * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    box.replaceChildren(
      el("p", { class: "pw-label" }, "Your code for the vet"),
      el("p", { class: "pair-code", attrs: { "aria-label": s.code.split("").join(" ") } }, spaced(s.code)),
      el("p", { class: "pw-hint flush" }, `Say it or send it to your vet, or let them scan the QR. Valid until ${until}.`),
      canvas,
      el("p", { class: "vet-wait", attrs: { role: "status" } }, el("span", { class: "vet-dot" }), "Waiting for your vet to type the code…"),
    );

    // 1. Wait for a vet to claim the code.
    let p = await waitFor(() => ownerPoll(s.id, s.ownerToken), (r) => r.status !== "waiting", alive).catch((x) => x);
    if (p instanceof PairGone) { forget(); return gone(); }
    if (!p || p instanceof Error || !("vetPub" in p)) return;
    const vetPub = p.vetPub;
    const vet = p.vet;
    const number = await pairNumber(s.code, keys.publicRaw, vetPub);

    // 2. Number matching: the owner checks the vet's screen shows the same number.
    const decided = await new Promise<boolean>((resolve) => {
      box.replaceChildren(
        el("p", { class: "pw-label" }, "A vet wants to confirm " + pet.name),
        el("p", { class: "pair-vet" }, svg("certificate"), el("span", {}, vetWho(vet))),
        el("p", { class: "pw-hint flush" }, "Does your vet's screen show this number?"),
        el("p", { class: "pair-number", attrs: { "aria-label": number.split("").join(" ") } }, number),
        el("div", { class: "bar pair-actions" },
          button("Yes, that's my vet", { kind: "primary", icon: "check", onClick: () => resolve(true) }),
          button("No", { kind: "ghost", onClick: () => resolve(false) }),
        ),
        el("p", { class: "pw-hint flush" }, "Yes sends your pet's microchip and rabies details to this vet only, encrypted, so they can check them."),
      );
    });
    if (!decided) {
      await ownerDecide(s.id, s.ownerToken, false).catch(() => undefined);
      forget();
      return box.replaceChildren(el("p", { class: "pw-notice" }, "Cancelled. Nothing was shared."), el("div", { class: "bar" }, again()));
    }
    const f = currentVetFields(pet);
    const toVet = await pairEncrypt(keys, vetPub, s.code, { n: pet.name, s: pet.species, c: f.microchip, rg: f.rabiesGivenOn, ru: f.rabiesValidUntil, rv: f.rabiesVaccine });
    try { await ownerDecide(s.id, s.ownerToken, true, toVet); } catch { forget(); return gone(); }
    box.replaceChildren(el("p", { class: "vet-wait", attrs: { role: "status" } }, el("span", { class: "vet-dot" }), `Waiting for ${vet?.name ?? "your vet"} to check and confirm…`));

    // 3. Wait for the vet's confirmation.
    p = await waitFor(() => ownerPoll(s.id, s.ownerToken), (r) => r.status === "done", alive, 30 * 60_000).catch((x) => x);
    forget();
    if (p instanceof PairGone) return gone("The vet did not confirm in time.");
    if (!p || p instanceof Error || !("result" in p) || !p.result) return;
    let got: unknown;
    try { got = await pairDecrypt(keys, vetPub, s.code, p.result); } catch { return gone("The answer could not be read. Make a new code."); }
    const c = vetConfirmationSchema.safeParse(got);
    if (!c.success || !(await verifyVetSeal(c.data.seal, c.data.fields))) return gone("The answer could not be checked. Make a new code.");
    const v = c.data.fields;
    // The vet's values win: they checked them.
    const others = pet.vaccinations.filter((x) => x.kind !== "rabies");
    const rabies = pet.vaccinations.filter((x) => x.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil));
    const latest = { ...(rabies[0] ?? { kind: "rabies" as const }), kind: "rabies" as const, administeredOn: v.rabiesGivenOn, validUntil: v.rabiesValidUntil, product: v.rabiesVaccine };
    onConfirmed({ ...pet, species: v.species, microchip: v.microchip, vaccinations: [...others, ...rabies.slice(1), latest], vetConfirmation: c.data });
  };
  void run();

  return [
    el("div", { class: "bar no-print" }, el("a", { href: `#/pet/${id}`, class: "back" }, svg("back"), pet.name)),
    el("h1", { class: "page-title" }, "Ask your vet to confirm"),
    box,
    el("p", { class: "pw-hint" }, "Your vet registers with PawID once (two minutes). They check the microchip and rabies vaccine in the passport or in their records, and confirm with their fingerprint. If they correct a date, your pet's details are updated."),
  ];
}

/** Polls every 2.5 s until done(result), the page changes, or the time runs out. */
async function waitFor<T>(get: () => Promise<T>, done: (r: T) => boolean, alive: () => boolean, ms = 15 * 60_000): Promise<T | null> {
  const end = Date.now() + ms;
  while (alive() && Date.now() < end) {
    try {
      const r = await get();
      if (done(r)) return r;
    } catch (x) {
      if (x instanceof PairGone) throw x;
      // offline for a moment: keep trying
    }
    await new Promise((res) => setTimeout(res, 2500));
  }
  return null;
}

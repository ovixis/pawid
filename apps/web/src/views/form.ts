import { petSchema, type Pet, type Treatment, type Vaccination } from "@pawid/core";
import { COUNTRY_GROUPS } from "../countries";
import { button, el, svg, today } from "../dom";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function field(label: string, input: Field, hint?: string): HTMLElement {
  const id = `f-${input.name}`;
  input.id = id;
  input.classList.add("pw-input");
  const box = el("div", {}, el("label", { class: "pw-label", htmlFor: id }, label), input);
  if (hint) {
    const h = el("p", { class: "pw-hint", id: `${id}-hint` }, hint);
    input.setAttribute("aria-describedby", h.id);
    box.append(h);
  }
  return box;
}

const input = (name: string, value = "", attrs: Partial<HTMLInputElement> = {}) => el("input", { name, value, ...attrs });
const date = (name: string, value?: string) => input(name, value ?? "", { type: "date", max: "2100-12-31" });

function card(title: string, ...children: Node[]): HTMLElement {
  return el("section", { class: "pw-card pw-card-pad" }, el("div", { class: "pw-card-head" }, el("h2", {}, title)), ...children);
}

export function formView(pet: Pet | undefined, onSave: (p: Pet) => void, onDelete?: () => void): Node[] {
  const rabies = pet?.vaccinations.filter((v) => v.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
  const tapeworm = pet?.treatments.filter((t) => t.kind === "echinococcus").sort((a, b) => b.administeredOn.localeCompare(a.administeredOn))[0];

  const species = el("div", { class: "seg", attrs: { role: "radiogroup", "aria-label": "Dog or cat" } });
  for (const [value, label] of [["dog", "Dog"], ["cat", "Cat"]] as const) {
    species.append(
      el("label", {}, el("input", { type: "radio", name: "species", value, checked: (pet?.species ?? "dog") === value }), el("img", { src: `/3d/${value}.webp`, alt: "", width: 24, height: 24 }), label),
    );
  }

  const sex = el("select", { name: "sex" }, el("option", { value: "" }, "Not given"), el("option", { value: "female" }, "Female"), el("option", { value: "male" }, "Male"));
  sex.value = pet?.sex ?? "";
  const country = el("select", { name: "homeCountry" }, el("option", { value: "" }, "Choose a country"));
  for (const g of COUNTRY_GROUPS) country.append(el("optgroup", { label: g.label }, ...g.items.map((c) => el("option", { value: c.code }, c.name))));
  country.value = pet?.homeCountry ?? "";
  const booster = el("input", { type: "checkbox", name: "boosterInTime", checked: pet?.boosterInTime === true });

  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const form = el(
    "form",
    { class: "pet-form", noValidate: true },
    card(
      "Your pet",
      el("div", { class: "fields" },
        species,
        field("Name", input("name", pet?.name ?? "", { required: true, autocomplete: "off", maxLength: 100 })),
        el("div", { class: "fields fields-2" },
          field("Breed", input("breed", pet?.breed ?? "", { maxLength: 100 })),
          field("Sex", sex),
          field("Weight in kg", input("weightKg", pet?.weightKg?.toString() ?? "", { inputMode: "decimal" })),
          field("Born on", date("birthDate", pet?.birthDate)),
        ),
      ),
    ),
    card(
      "Identification",
      el("div", { class: "fields fields-2" },
        field("Microchip number", input("microchip", pet?.microchip ?? "", { inputMode: "numeric", autocomplete: "off", maxLength: 19 }), "15 digits, on the passport's first pages."),
        field("Implanted on", date("chipDate", pet?.chipDate)),
        field("Pet passport number", input("passportNumber", pet?.passportNumber ?? "", { maxLength: 40, autocomplete: "off" })),
        field("Home country", country),
      ),
    ),
    card(
      "Rabies vaccine",
      el("div", { class: "fields fields-2" },
        field("Given on", date("rabiesGiven", rabies?.administeredOn)),
        field("Valid until", date("rabiesUntil", rabies?.validUntil), "As written by the vet in the passport."),
      ),
      el("label", { class: "check" }, booster, el("span", {}, el("b", {}, "Booster given in time"), el("span", {}, "The new vaccine was given before the previous one expired."))),
    ),
    card(
      "Vet",
      el("div", { class: "fields fields-2" },
        field("Name or clinic", input("vetName", pet?.vet?.name ?? "", { maxLength: 120, autocomplete: "off" })),
        field("Phone", input("vetPhone", pet?.vet?.phone ?? "", { type: "tel", maxLength: 40, autocomplete: "off" })),
      ),
    ),
    el(
      "details",
      { class: "pw-card pw-card-pad more", open: Boolean(pet?.registryNumber || tapeworm || pet?.healthCertificateDate || pet?.titreTestDate) },
      el("summary", {}, "More papers"),
      el("p", { class: "pw-hint lead" }, "Only if your trip or your country asks for them."),
      el("div", { class: "fields fields-2" },
        field("National registry number", input("registryNumber", pet?.registryNumber ?? "", { maxLength: 60, autocomplete: "off" })),
        field("Tapeworm treatment given on", date("tapeworm", tapeworm?.administeredOn)),
        field("Animal health certificate issued on", date("healthCertificateDate", pet?.healthCertificateDate)),
        field("Rabies blood test taken on", date("titreTestDate", pet?.titreTestDate)),
      ),
    ),
    card("Notes", field("For the people who look after your pet", el("textarea", { name: "notes", value: pet?.notes ?? "", maxLength: 1000 }), "Food, character, anything a host should know. Up to 280 characters can go on the code you show.")),
    err,
  );

  const save = button(pet ? "Save changes" : "Save", { kind: "primary", type: "submit" });
  const bar = el("div", { class: "sticky-save" }, save, el("a", { href: pet ? `#/pet/${encodeURIComponent(pet.id)}` : "#/", class: "pw-btn pw-btn-ghost" }, "Cancel"));
  if (onDelete) bar.append(el("span", { class: "grow" }), button("Delete", { kind: "ghost", icon: "delete", onClick: onDelete }));
  form.append(bar);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    for (const f of form.querySelectorAll<Field>("[aria-invalid]")) f.removeAttribute("aria-invalid");
    const v = (n: string) => ((form.elements.namedItem(n) as Field | null)?.value ?? "").trim();
    const opt = (n: string) => v(n) || undefined;
    const fail = (name: string, msg: string) => {
      err.textContent = msg;
      const f = form.elements.namedItem(name) as Field | null;
      f?.setAttribute("aria-invalid", "true");
      f?.focus();
    };

    const given = v("rabiesGiven");
    const until = v("rabiesUntil");
    if (Boolean(given) !== Boolean(until)) return fail(given ? "rabiesUntil" : "rabiesGiven", "Fill both rabies dates, or leave both empty.");
    if (given && until && until < given) return fail("rabiesUntil", "The vaccine can't expire before it was given.");
    const weight = v("weightKg").replace(",", ".");
    if (weight && !(Number(weight) > 0 && Number(weight) <= 150)) return fail("weightKg", "Write the weight in kg, for example 12.5.");
    const chip = v("microchip").replace(/[\s-]/g, "");

    const vaccinations: Vaccination[] = (pet?.vaccinations ?? []).filter((x) => x.kind !== "rabies" || x !== rabies);
    if (given && until) vaccinations.push({ kind: "rabies", administeredOn: given, validUntil: until });
    const treatments: Treatment[] = (pet?.treatments ?? []).filter((t) => t !== tapeworm);
    if (v("tapeworm")) treatments.push({ kind: "echinococcus", administeredOn: v("tapeworm") });

    const candidate = {
      id: pet?.id ?? crypto.randomUUID(),
      species: (form.querySelector<HTMLInputElement>('input[name="species"]:checked')?.value ?? "dog") as Pet["species"],
      name: v("name"),
      breed: opt("breed"),
      sex: (opt("sex") as Pet["sex"]) ?? undefined,
      weightKg: weight ? Number(weight) : undefined,
      birthDate: opt("birthDate"),
      microchip: chip || undefined,
      chipDate: opt("chipDate"),
      passportNumber: opt("passportNumber"),
      homeCountry: opt("homeCountry"),
      registryNumber: opt("registryNumber"),
      vaccinations,
      boosterInTime: booster.checked || undefined,
      treatments,
      healthCertificateDate: opt("healthCertificateDate"),
      titreTestDate: opt("titreTestDate"),
      vet: opt("vetName") || opt("vetPhone") ? { name: opt("vetName"), phone: opt("vetPhone") } : undefined,
      notes: opt("notes"),
      updatedAt: today(),
    };
    const parsed = petSchema.safeParse(candidate);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const name = String(issue?.path[0] ?? "name");
      return fail(name === "microchip" ? "microchip" : name, issue?.message.startsWith("expected") ? "Check this field." : issue?.message ?? "Check the form.");
    }
    onSave(parsed.data);
  });

  return [
    el("div", { class: "bar" }, el("a", { href: pet ? `#/pet/${encodeURIComponent(pet.id)}` : "#/", class: "back" }, svg("back"), pet ? pet.name : "Your pets")),
    el("h1", { class: "page-title" }, pet ? `Edit ${pet.name}` : "Add your pet"),
    el("p", { class: "pw-notice" }, "Copy what the vet wrote in the pet passport. Leave empty what you don't know."),
    form,
  ];
}

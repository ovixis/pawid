import type { Pet } from "@pawid/core";
import { vaccineCountries, vaccinePlan, type PlanItem, type Src, type When } from "@pawid/rules";
import { longDate } from "@pawid/ui";
import { el, svg, today } from "../dom";

const PILL: Record<When, [string, string]> = {
  past: ["Past", "pw-status-navy"],
  now: ["Now", "pw-status-warn"],
  next: ["Next", "pw-status-ok"],
  later: ["Later", "pw-status-navy"],
  nodate: ["No date", "pw-status-warn"],
};
const GROUP: Record<PlanItem["group"], string> = { core: "Core", booster: "Core booster", law: "Required by law", travel: "Travel" };
const prefsKey = (id: string) => `pawid.vplan.${id}`;
type Prefs = { country?: string; region?: string; outdoor?: boolean; highRisk?: boolean };
function loadPrefs(id: string): Prefs { try { return JSON.parse(localStorage.getItem(prefsKey(id)) ?? "{}") as Prefs; } catch { return {}; } }
function savePrefs(id: string, p: Prefs) { try { localStorage.setItem(prefsKey(id), JSON.stringify(p)); } catch { /* private mode */ } }

const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");
function srcLine(s: Src): HTMLElement {
  return el("details", { class: "v-src" },
    el("summary", {}, s.status === "verified" ? "" : el("span", { class: "pw-status pw-status-warn" }, "Being checked"), s.status === "verified" ? "" : " ", `Source: ${host(s.url)}`),
    el("p", {}, el("a", { href: s.url, target: "_blank", rel: "noopener", class: "pw-link" }, s.name), `. Checked ${longDate(s.lastChecked)}.`),
    s.quote ? el("q", { class: "v-quote" }, s.quote) : "",
  );
}
const dates = (it: PlanItem) => {
  if (!it.from) return "No date";
  const a = longDate(it.from)!;
  return it.to && it.to !== it.from ? `${a} to ${longDate(it.to)}` : a;
};

/** #/pet/<id>/vaccines */
export function vaccinesView(pet: Pet): Node[] {
  const id = encodeURIComponent(pet.id);
  const head = [
    el("div", { class: "bar no-print" }, el("a", { href: `#/pet/${id}`, class: "back" }, svg("back"), pet.name)),
    el("h1", { class: "page-title" }, "Vaccine plan"),
  ];
  if (!pet.birthDate) {
    return [...head, el("p", { class: "pw-notice" }, `Add ${pet.name}'s birth date (it is in the passport) to see the typical vaccine dates.`), el("a", { href: `#/pet/${id}/edit`, class: "pw-btn pw-btn-primary" }, "Add the birth date")];
  }

  const prefs = loadPrefs(pet.id);
  const countries = vaccineCountries();
  const country = prefs.country ?? (countries.some((c) => c.country === pet.homeCountry) ? pet.homeCountry! : countries[0]!.country);
  const out = el("div", { class: "v-out" });
  const countrySel = el("select", { id: "v-country", class: "pw-input" }, ...countries.map((c) => el("option", { value: c.country, selected: c.country === country }, c.name)));
  const regionWrap = el("div");
  const riskWrap = el("div", { class: "v-risk" });
  const outdoor = el("input", { type: "checkbox", id: "v-out", checked: Boolean(prefs.outdoor) });
  const high = el("input", { type: "checkbox", id: "v-high", checked: Boolean(prefs.highRisk) });
  if (pet.species === "cat") riskWrap.append(
    el("label", { class: "v-check", htmlFor: "v-out" }, outdoor, `${pet.name} goes outside, or meets cats of unknown health`),
    el("label", { class: "v-check", htmlFor: "v-high" }, high, "Lives with many cats (shelter, breeding or boarding cattery, many cats at home)"),
  );
  const form = el("form", { class: "pw-card pw-card-pad trip-form no-print" },
    el("div", { class: "fields fields-3" }, el("div", {}, el("label", { class: "pw-label", htmlFor: "v-country" }, "Lives in"), countrySel), regionWrap),
    riskWrap,
  );

  const render = () => {
    const p: Prefs = { country: countrySel.value, region: (regionWrap.querySelector("select") as HTMLSelectElement | null)?.value || prefs.region, outdoor: outdoor.checked, highRisk: high.checked };
    const plan = vaccinePlan({ species: pet.species, birthDate: pet.birthDate!, today: today(), country: p.country, region: p.region, outdoor: p.outdoor, highRisk: p.highRisk, vaccinations: pet.vaccinations });
    if (plan.regions.length) {
      if (!regionWrap.querySelector("select")) {
        const sel = el("select", { id: "v-region", class: "pw-input" }, el("option", { value: "" }, "Choose your region"), ...plan.regions.map((r) => el("option", { value: r.id, selected: r.id === p.region }, r.name)));
        regionWrap.replaceChildren(el("label", { class: "pw-label", htmlFor: "v-region" }, "Region"), sel);
      }
    } else { regionWrap.replaceChildren(); p.region = undefined; }
    savePrefs(pet.id, p);

    const item = (it: PlanItem) => el("li", { class: `v-item v-${it.when}` },
      el("p", { class: "v-when" }, el("span", { class: `pw-status ${PILL[it.when][1]}` }, PILL[it.when][0]), el("b", {}, dates(it)), it.age ? el("span", {}, it.age) : ""),
      el("div", {},
        el("p", { class: "v-label" }, el("b", {}, it.label), " ", el("span", { class: `v-tag v-tag-${it.group}` }, GROUP[it.group])),
        it.vaccines.length ? el("p", {}, it.vaccines.join(", ")) : "",
        it.text ? el("p", {}, it.text) : "",
        it.countedFrom ? el("p", {}, `Counted from the vaccination on ${longDate(it.countedFrom)} in the passport.`) : "",
        it.inPassport ? el("p", { class: "v-done" }, svg("checkCircleFill"), `In the passport: a vaccination on ${longDate(it.inPassport)}.`) : "",
        srcLine(it.src),
      ),
    );
    const past = plan.items.filter((i) => i.when === "past");
    const ahead = plan.items.filter((i) => i.when !== "past");
    const pastBox = past.length ? el("details", { class: "rules-all" }, el("summary", {}, `Already past (${past.length})`), el("ul", { class: "v-list" }, ...past.map(item))) : "";
    const s = plan.schedule;
    out.replaceChildren(
      el("p", { class: "pw-notice v-disclaimer" }, svg("stethoscope"), el("span", {}, el("b", {}, "Your vet decides. "), plan.disclaimer)),
      el("section", { class: "pw-card pw-card-pad", attrs: { "aria-labelledby": "v-title" } },
        el("div", { class: "pw-card-head" }, el("h2", { id: "v-title" }, `${pet.name}, born ${longDate(pet.birthDate)}`)),
        el("p", { class: "pw-hint" }, "Typical schedule: ", el("a", { href: s.url, target: "_blank", rel: "noopener", class: "pw-link" }, s.name), "."),
        s.foreign ? el("p", { class: "pw-hint" }, `${s.why} PawID uses this official European schedule instead.`) : "",
        el("ul", { class: "v-list" }, ...ahead.slice(0, 4).map(item)),
        ahead.length > 4 ? el("details", { class: "rules-all" }, el("summary", {}, `Later (${ahead.length - 4})`), el("ul", { class: "v-list" }, ...ahead.slice(4).map(item))) : "",
        pastBox,
      ),
      plan.notes.length ? el("section", { class: "pw-card pw-card-pad", attrs: { "aria-labelledby": "v-law" } },
        el("div", { class: "pw-card-head" }, el("h2", { id: "v-law" }, `The law in ${plan.countryName}`)),
        el("ul", { class: "rule-list" }, ...plan.notes.map((n) => el("li", { class: "rule" }, el("p", {}, n.text), n.src.todo && n.src.status !== "verified" ? el("p", { class: "pw-hint flush" }, `Still to check: ${n.src.todo}`) : "", srcLine(n.src)))),
      ) : "",
      plan.optional.length ? el("section", { class: "pw-card pw-card-pad", attrs: { "aria-labelledby": "v-opt" } },
        el("div", { class: "pw-card-head" }, el("h2", { id: "v-opt" }, "Optional vaccines")),
        el("p", { class: "pw-hint" }, "Only for some pets, depending on where they live and what they do. Ask your vet."),
        el("details", { class: "rules-all", open: plan.optional.some((o) => o.forYou) },
          el("summary", {}, `${plan.optional.length} optional vaccines`),
          el("ul", { class: "rule-list" }, ...plan.optional.map((o) => el("li", { class: "rule" },
            el("p", {}, el("b", {}, o.vaccine), o.forYou ? el("span", { class: "pw-status pw-status-ok v-for" }, `For ${pet.name}`) : "", o.from ? ` From ${longDate(o.from)} (${o.age}).` : ""),
            el("p", {}, o.when),
            srcLine(o.src),
          ))),
        ),
      ) : "",
      el("p", { class: "pw-hint" }, `Sources checked ${longDate(plan.lastChecked)}. European sources only. `, el("a", { href: "https://github.com/ovixis/pawid/blob/main/rules/vaccines.yaml", target: "_blank", rel: "noopener", class: "pw-link" }, "The data, open on GitHub"), "."),
    );
  };
  form.addEventListener("change", (e) => { if ((e.target as HTMLElement).id === "v-country") regionWrap.replaceChildren(); render(); });
  form.addEventListener("submit", (e) => e.preventDefault());
  render();
  return [...head, form, out];
}

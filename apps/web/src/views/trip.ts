import type { Pet } from "@pawid/core";
import { COUNTRIES } from "@pawid/rules";
import { countryName, longDate } from "@pawid/ui";
import { COUNTRY_GROUPS } from "../countries";
import { el, svg, today } from "../dom";
import { checkTrip, countryRules, type Check, type State } from "../tripcheck";

const PILL: Record<State, [string, string]> = {
  ok: ["OK", "pw-status-ok"],
  warn: ["Check", "pw-status-warn"],
  no: ["Not yet", "pw-status-no"],
  todo: ["To do", "pw-status-navy"],
};
const COVERED = new Set(COUNTRIES.map((c) => c.country));
const plusDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

/** #/travel?pet=<id>&to=<ISO2>&date=<YYYY-MM-DD> */
export function tripView(pets: Pet[], q: URLSearchParams): Node[] {
  const pet = pets.find((p) => p.id === q.get("pet")) ?? pets[0];
  const to = (q.get("to") ?? "").toUpperCase();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(q.get("date") ?? "") ? q.get("date")! : plusDays(7);

  const head = [
    el("div", { class: "bar no-print" }, el("a", { href: pet ? `#/pet/${encodeURIComponent(pet.id)}` : "#/", class: "back" }, svg("back"), pet ? pet.name : "Your pets")),
    el("h1", { class: "page-title" }, "Can I travel?"),
  ];
  if (!pet) return [...head, el("p", { class: "pw-notice" }, "Add your pet first: the check uses the microchip and vaccine dates from the pet passport."), el("a", { href: "#/pet/new", class: "pw-btn pw-btn-primary" }, "Add your pet")];

  const petSel = el("select", { name: "pet", id: "t-pet", class: "pw-input" }, ...pets.map((p) => el("option", { value: p.id, selected: p.id === pet.id }, p.name)));
  const countrySel = el("select", { name: "to", id: "t-to", class: "pw-input" }, el("option", { value: "" }, "Choose a country"));
  const eu = COUNTRY_GROUPS[0]!.items;
  countrySel.append(
    el("optgroup", { label: "Checked by PawID" }, ...eu.filter((c) => COVERED.has(c.code)).map((c) => el("option", { value: c.code, selected: c.code === to }, c.name))),
    el("optgroup", { label: "Other EU countries (EU rules only)" }, ...eu.filter((c) => !COVERED.has(c.code)).map((c) => el("option", { value: c.code, selected: c.code === to }, c.name))),
  );
  const dateIn = el("input", { type: "date", name: "date", id: "t-date", value: date, min: today(), class: "pw-input" });
  const form = el("form", { class: "pw-card pw-card-pad trip-form" },
    el("div", { class: "fields fields-3" },
      el("div", {}, el("label", { class: "pw-label", htmlFor: "t-pet" }, "Pet"), petSel),
      el("div", {}, el("label", { class: "pw-label", htmlFor: "t-to" }, "Going to"), countrySel),
      el("div", {}, el("label", { class: "pw-label", htmlFor: "t-date" }, "Arriving on"), dateIn),
    ),
    el("p", { class: "pw-hint flush" }, "For travel from one EU country to another."),
  );
  const go = () => {
    const p = new URLSearchParams({ pet: petSel.value, ...(countrySel.value ? { to: countrySel.value } : {}), date: dateIn.value || date });
    location.replace(`#/travel?${p}`);
  };
  form.addEventListener("change", go);
  form.addEventListener("submit", (e) => { e.preventDefault(); go(); });

  if (!to) return [...head, form];

  const rules = countryRules(to);
  const checks = checkTrip(pet, to, date);
  const blocking = checks.filter((c) => c.state === "no").length;
  const summary = el("p", { class: `trip-sum ${blocking ? "trip-sum-no" : "trip-sum-ok"}`, attrs: { role: "status" } },
    svg(blocking ? "closeCircleFill" : "checkCircleFill"),
    blocking
      ? `${blocking === 1 ? "One thing" : `${blocking} things`} to fix before ${pet.name} can go to ${countryName(to)} on ${longDate(date)}.`
      : `Nothing blocking in what you entered for ${countryName(to)} on ${longDate(date)}. Do the "To do" items and read the rules below.`,
  );
  const item = (c: Check) => el("li", { class: "trip-item" },
    el("span", { class: `pw-status ${PILL[c.state][1]}` }, PILL[c.state][0]),
    el("div", {}, el("b", {}, c.title), el("p", {}, c.text), c.rule ? el("button", { type: "button", class: "pw-link trip-rule", onclick: () => { allRules.open = true; document.getElementById(`rule-${c.rule}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); } }, "The rule and its source") : ""),
  );

  const allRules = el("details", { class: "rules-all" });
  const ruleList = el("ul", { class: "rule-list" }, ...rules.rules.map((r) => el("li", { id: `rule-${r.id}`, class: `rule rule-${r.status}` },
    el("p", { class: "rule-meta" },
      el("span", { class: `pw-status ${r.status === "verified" ? "pw-status-ok" : "pw-status-warn"}` }, r.status === "verified" ? "Checked" : "Being checked"),
      el("span", {}, `${r.scope === "eu" ? "EU rule" : countryName(to)}, checked ${longDate(r.lastChecked)}`),
    ),
    el("p", {}, r.text),
    el("p", { class: "rule-src" }, "Source: ", ...r.sources.flatMap((s, i) => [i ? ", " : "", el("a", { href: s, target: "_blank", rel: "noopener", class: "pw-link" }, new URL(s).hostname.replace(/^www\./, ""))])),
  )));

  const reviewing = rules.rules.filter((r) => r.status !== "verified").length;
  allRules.append(el("summary", {}, `All ${rules.rules.length} rules${rules.countryCovered ? ` for ${countryName(to)}` : ""}`, reviewing ? el("small", {}, ` (${reviewing} being checked)`) : ""), ruleList);
  return [
    ...head,
    form,
    summary,
    el("ul", { class: "trip-list pw-card pw-card-pad" }, ...checks.map(item)),
    el("section", { class: "pw-card pw-card-pad", attrs: { "aria-labelledby": "rules-title" } },
      el("div", { class: "pw-card-head" }, el("h2", { id: "rules-title" }, rules.countryCovered ? `Rules for ${countryName(to)}` : "EU rules")),
      rules.countryCovered ? "" : el("p", { class: "pw-notice" }, `PawID has not checked ${countryName(to)}'s own rules yet. These are the EU rules only: check ${countryName(to)}'s official page too.`),
      allRules,
      el("p", { class: "pw-hint flush" }, rules.disclaimer, " ", el("a", { href: "https://github.com/ovixis/pawid/issues/new/choose", class: "pw-link", target: "_blank", rel: "noopener" }, "Report a wrong rule"), "."),
    ),
  ];
}

// /rules: every travel rule PawID uses, with its official source and last check, and a fact check on
// each one. Anyone can confirm a rule or suggest a correction with a source; HosPet.eu reviews each
// check before it shows. A rule itself changes only in the rule files on GitHub.
import { BY_HOSPET, countryName, longDate, type IconName } from "@pawid/ui";
import { COUNTRIES, isOfficialSource, rulesFor, type RulesFor } from "@pawid/rules";
import { button, el, revealOnScroll, siteFooter, svg, topBar } from "./dom";
import { moveToNewAddress } from "./move";
import { API } from "./pair";
import { injectStyles } from "./style";
import { humanCheck } from "./turnstile";

injectStyles();
moveToNewAddress();

const css = document.createElement("style");
css.textContent = `
.r-hero { color: #fff; display: grid; gap: .75rem; }
.r-hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.8vw, 2.625rem); line-height: 1.06; font-weight: 800; letter-spacing: -.035em; text-wrap: balance; }
.r-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.r-hero p { margin: 0; color: rgb(255 255 255 / .86); max-width: 42rem; }
.r-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .r-sec { padding: 1.5rem; } }
.r-sec > * { min-width: 0; }
.r-sec h2 { margin: 0; display: flex; align-items: center; gap: .75rem; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.r-sec > p { margin: 0; color: var(--pw-ink-muted); }
.r-tabs { display: flex; gap: .375rem; overflow-x: auto; scrollbar-width: none; padding: .25rem; margin: -.25rem; }
.r-tabs a { flex: none; display: inline-flex; align-items: center; min-height: 2.5rem; padding: 0 1rem; border-radius: 9999px; background: var(--pw-surface); box-shadow: var(--pw-shadow-raised); color: var(--pw-ink); font-weight: 700; text-decoration: none; }
.r-tabs a[aria-current="page"] { background: var(--pw-navy-800); color: #fff; }
.r-tabs a:focus-visible { outline: 3px solid var(--pw-gold-500); outline-offset: 2px; }
.r-help { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.r-help a { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .25rem .75rem; padding: .75rem .875rem; border-radius: var(--pw-radius-control); background: var(--pw-gold-50); color: inherit; text-decoration: none; }
.r-help a:hover { box-shadow: inset 0 0 0 2px var(--pw-gold-500); }
.r-help b { white-space: nowrap; }
.r-help span { color: var(--pw-ink-muted); }
.r-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.r-rule { display: grid; gap: .625rem; padding: 1rem; border-radius: var(--pw-radius-card); background: var(--pw-surface); box-shadow: var(--pw-shadow-raised); scroll-margin-top: 5rem; }
.r-rule:target { box-shadow: 0 0 0 3px var(--pw-gold-500), var(--pw-shadow-raised); }
.r-rule > * { margin: 0; min-width: 0; }
.r-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem .625rem; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); }
.r-todo { padding: .625rem .75rem; border-radius: var(--pw-radius-control); background: var(--pw-gold-50); color: var(--pw-ink); font-size: var(--pw-text-sm); }
.r-src { font-size: var(--pw-text-xs); color: var(--pw-ink-muted); overflow-wrap: anywhere; }
.r-fc { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; padding-top: .625rem; border-top: 1px solid var(--pw-line); }
.r-fc-sum { display: inline-flex; align-items: center; gap: .375rem; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); }
.r-fc-sum .pw-icon { width: 1.125rem; height: 1.125rem; color: var(--pw-navy-700); }
.r-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: .5rem; }
.r-checks li { padding: .625rem .75rem; border-radius: var(--pw-radius-control); background: var(--pw-canvas); font-size: var(--pw-text-sm); display: grid; gap: .25rem; }
.r-checks p { margin: 0; color: var(--pw-ink-muted); overflow-wrap: anywhere; }
.r-checks blockquote { margin: 0; padding-left: .625rem; border-left: 3px solid var(--pw-line); color: var(--pw-ink-muted); font-style: italic; }
.r-badge { display: inline-flex; align-items: center; gap: .25rem; padding: .0625rem .5rem; border-radius: 9999px; font-size: var(--pw-text-2xs, .75rem); font-weight: 700; background: var(--pw-surface-muted); color: var(--pw-ink); }
.r-badge-fc { background: var(--pw-navy-800); color: #fff; }
.r-form { display: grid; gap: .875rem; padding: 1rem; border-radius: var(--pw-radius-card); background: var(--pw-canvas); box-shadow: inset 0 0 0 1px var(--pw-line); }
.r-form > * { min-width: 0; margin: 0; }
.r-chips { display: flex; flex-wrap: wrap; gap: .5rem; border: 0; margin: 0; padding: 0; }
.r-chips legend { padding: 0; margin-bottom: .375rem; }
.r-chips label { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.5rem; padding: 0 .875rem; border-radius: 9999px; background: var(--pw-surface); box-shadow: var(--pw-shadow-raised); font-weight: 600; cursor: pointer; }
.r-chips label:has(input:checked) { background: var(--pw-navy-800); color: #fff; }
.r-chips input { accent-color: var(--pw-gold-500); }
.r-about { display: grid; gap: .75rem; }
.r-about[open] > summary { margin-bottom: .75rem; }
.r-about summary, .r-eu summary { cursor: pointer; font-weight: 700; }
.r-list-eu { margin-top: .75rem; }
.r-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.r-steps { margin: 0; padding-left: 1.25rem; display: grid; gap: .5rem; color: var(--pw-ink-muted); }
.r-steps b { color: var(--pw-ink); }
.r-nets { display: grid; gap: .625rem; }
@media (min-width: 40rem) { .r-nets { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.r-nets a { display: grid; gap: .25rem; padding: .875rem 1rem; border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); color: inherit; text-decoration: none; }
.r-nets a:hover { box-shadow: var(--pw-shadow-lifted); }
.r-nets span { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
`;
document.head.append(css);

interface Check { verdict: "confirm" | "correct" | "outdated"; source: string; official: boolean; quote: string | null; suggestion: string | null; by: { name: string | null; organization: string | null } | null; role: string; factChecker: boolean; day: string; reviewed: string | null }
interface Checks { checks: Record<string, Check[]>; pending: Record<string, number> }

const scope = (new URLSearchParams(location.search).get("c") ?? "EU").toUpperCase();
const country = COUNTRIES.some((c) => c.country === scope) ? scope : null;
const data: RulesFor = rulesFor(country);
const keyOf = (r: RulesFor["rules"][number]) => `${r.scope === "eu" ? "EU" : country}.${r.id}`;
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };
const ROLE: Record<string, string> = { owner: "Pet owner", vet: "Vet", venue: "Venue", factchecker: "Fact-checker", authority: "Public authority", other: "Other" };
const VERDICT: Record<Check["verdict"], [string, IconName]> = { confirm: ["Confirmed", "checkCircle"], correct: ["Correction", "edit"], outdated: ["Out of date", "time"] };

/** One fact-check form, opened under a rule. */
function checkForm(key: string, onClose: () => void): HTMLElement {
  const uid = key.replace(/\W/g, "-");
  const radio = (name: string, v: string, label: string, checked = false) => el("label", {}, el("input", { type: "radio", name: `${name}-${uid}`, value: v, required: true, checked }), label);
  const verdicts = el("fieldset", { class: "r-chips" }, el("legend", { class: "pw-label" }, "This rule is"), radio("v", "confirm", "Right", true), radio("v", "correct", "Wrong"), radio("v", "outdated", "Out of date"));
  const source = el("input", { type: "url", required: true, maxLength: 600, placeholder: "https://", id: `src-${uid}`, class: "pw-input", inputMode: "url" });
  const srcHint = el("p", { class: "pw-hint flush" }, "The page that says it: best a ministry, a national authority or EUR-Lex.");
  source.addEventListener("input", () => {
    const u = source.value.trim();
    srcHint.textContent = !/^https:\/\/\S+\.\S+/.test(u) ? "The page that says it: best a ministry, a national authority or EUR-Lex."
      : isOfficialSource(u) ? "An official page. Thank you." : "Not on our list of official pages. You can still send it: the reviewer will look for an official one.";
  });
  const quote = el("textarea", { maxLength: 600, rows: 2, id: `q-${uid}`, class: "pw-input" });
  const sugg = el("textarea", { maxLength: 1000, rows: 3, id: `s-${uid}`, class: "pw-input" });
  const suggBox = el("div", { hidden: true }, el("label", { class: "pw-label", htmlFor: `s-${uid}` }, "How the rule should read"), sugg);
  verdicts.addEventListener("change", () => {
    const fix = verdicts.querySelector<HTMLInputElement>("input:checked")?.value !== "confirm";
    suggBox.hidden = !fix;
    sugg.required = fix;
    sugg.minLength = fix ? 10 : 0;
  });
  const role = el("select", { id: `r-${uid}`, class: "pw-input" }, ...Object.entries(ROLE).map(([v, l]) => el("option", { value: v }, l)));
  const name = el("input", { maxLength: 100, autocomplete: "name", id: `n-${uid}`, class: "pw-input" });
  const org = el("input", { maxLength: 120, autocomplete: "organization", id: `o-${uid}`, class: "pw-input" });
  const email = el("input", { type: "email", maxLength: 200, autocomplete: "email", id: `e-${uid}`, class: "pw-input" });
  const pub = el("input", { type: "checkbox" });
  const hp = el("input", { tabIndex: -1, autocomplete: "off", attrs: { "aria-hidden": "true" } });
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const tsBox = el("div", { class: "ts-box" });
  const human = humanCheck(tsBox);
  const go = button("Send the check", { kind: "primary", type: "submit", icon: "check" });
  const f = el("form", { class: "r-form" },
    verdicts,
    el("div", {}, el("label", { class: "pw-label", htmlFor: `src-${uid}` }, "Source"), source, srcHint),
    el("div", {}, el("label", { class: "pw-label", htmlFor: `q-${uid}` }, "The words on that page (optional)"), quote, el("p", { class: "pw-hint flush" }, "Copy the sentence that says it, in any language. It makes the review faster.")),
    suggBox,
    el("details", { class: "r-about" }, el("summary", { class: "pw-link" }, "About you (optional)"),
      el("div", { class: "fields fields-2" },
        el("div", {}, el("label", { class: "pw-label", htmlFor: `r-${uid}` }, "I am"), role),
        el("div", {}, el("label", { class: "pw-label", htmlFor: `o-${uid}` }, "Organisation"), org),
        el("div", {}, el("label", { class: "pw-label", htmlFor: `n-${uid}` }, "Name"), name),
        el("div", {}, el("label", { class: "pw-label", htmlFor: `e-${uid}` }, "Email"), email),
      ),
      el("label", { class: "check" }, pub, el("span", {}, el("b", {}, "Show my name and organisation with the check"), el("span", {}, "Your email is never shown. Fact-checkers: add your organisation and email so we can give your checks the badge."))),
    ),
    el("label", { class: "r-hp" }, "Leave empty", hp),
    tsBox,
    err,
    el("div", { class: "bar" }, go, button("Cancel", { kind: "ghost", onClick: onClose })),
  );
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    if (!f.reportValidity()) return;
    go.disabled = true;
    try {
      const turnstile = await human.token();
      const verdict = verdicts.querySelector<HTMLInputElement>("input:checked")?.value ?? "confirm";
      const r = await fetch(`${API}/v1/factchecks`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ rule: key, verdict, source: source.value.trim(), quote: quote.value.trim() || undefined, suggestion: verdict === "confirm" ? undefined : sugg.value.trim(),
          name: name.value.trim() || undefined, role: role.value, organization: org.value.trim() || undefined, email: email.value.trim() || undefined, public: pub.checked, website: hp.value, turnstile }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Something went wrong. Try again.");
      f.replaceWith(el("p", { class: "r-todo", attrs: { role: "status" } }, el("b", {}, "Thank you. "), "HosPet.eu reviews each check, usually within a few days. If it is accepted it shows here, and a correction goes into the rule."));
    } catch (x) {
      err.textContent = (x as Error).message;
      human.reset();
    } finally {
      go.disabled = false;
    }
  });
  return f;
}

function checkItem(c: Check, ruleChecked: string): HTMLElement {
  const [label, icon] = VERDICT[c.verdict];
  const applied = c.verdict !== "confirm" && c.reviewed && c.reviewed <= ruleChecked;
  return el("li", {},
    el("p", { class: "r-meta" },
      el("span", { class: "r-badge" }, svg(icon), label),
      c.factChecker ? el("span", { class: "r-badge r-badge-fc" }, svg("factCheck"), "Fact-checking organisation") : "",
      c.verdict !== "confirm" ? el("span", { class: "r-badge" }, applied ? "Applied to the rule" : "Accepted, rule update coming") : "",
      el("span", {}, [c.by?.name, c.by?.organization].filter(Boolean).join(", ") || ROLE[c.role] || "", `, ${longDate(c.day)}`),
    ),
    c.quote ? el("blockquote", {}, c.quote) : "",
    c.suggestion ? el("p", {}, el("b", {}, "Suggested: "), c.suggestion) : "",
    el("p", {}, el("a", { href: c.source, target: "_blank", rel: "noopener nofollow", class: "pw-link" }, host(c.source)), c.official ? " (official)" : ""),
  );
}

const fcSlots = new Map<string, HTMLElement>();
let openForm: { key: string; node: HTMLElement } | null = null;

function ruleCard(r: RulesFor["rules"][number]): HTMLElement {
  const key = keyOf(r);
  const slot = el("div", { class: "r-fc-body" });
  const sum = el("span", { class: "r-fc-sum" }, svg("factCheck"), "No fact checks yet");
  const btn = button("Confirm or correct", { kind: "secondary", icon: "factCheck" });
  btn.setAttribute("aria-expanded", "false");
  const card = el("li", { class: "r-rule", id: `rule-${key}` },
    el("p", { class: "r-meta" },
      el("span", { class: `pw-status ${r.status === "verified" ? "pw-status-ok" : "pw-status-warn"}` }, r.status === "verified" ? "Checked" : "Being checked"),
      el("span", {}, `${r.scope === "eu" ? "EU rule" : countryName(country!) ?? country}, checked ${longDate(r.lastChecked)}`),
    ),
    el("p", {}, r.text),
    r.status !== "verified" && r.todo ? el("p", { class: "r-todo" }, el("b", {}, "What needs checking: "), r.todo) : "",
    el("p", { class: "r-src" }, "Source: ", ...r.sources.flatMap((s, i) => [i ? ", " : "", el("a", { href: s, target: "_blank", rel: "noopener", class: "pw-link" }, host(s))])),
    el("div", { class: "r-fc" }, sum, btn),
    slot,
  );
  btn.addEventListener("click", () => {
    if (openForm?.key === key) { close(); return; }
    if (openForm) openForm.node.remove(), document.querySelector(`[id="rule-${openForm.key}"] .r-fc button`)?.setAttribute("aria-expanded", "false");
    const node = checkForm(key, close);
    slot.prepend(node);
    openForm = { key, node };
    btn.setAttribute("aria-expanded", "true");
    node.querySelector<HTMLInputElement>("input[type=url]")?.focus();
  });
  function close() { openForm?.node.remove(); openForm = null; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
  fcSlots.set(key, card);
  return card;
}

async function loadChecks(): Promise<void> {
  let d: Checks;
  try { d = (await (await fetch(`${API}/v1/factchecks?scope=${country ?? "EU"}`, { credentials: "omit" })).json()) as Checks; } catch { return; }
  for (const r of data.rules) {
    const key = keyOf(r);
    const card = fcSlots.get(key);
    if (!card) continue;
    const list = d.checks[key] ?? [];
    const pending = d.pending[key] ?? 0;
    const confirms = list.filter((c) => c.verdict === "confirm").length;
    const fixes = list.length - confirms;
    const parts = [confirms ? `Confirmed by ${confirms} ${confirms === 1 ? "person" : "people"} with a source` : "", fixes ? `${fixes} ${fixes === 1 ? "correction" : "corrections"} accepted` : "", pending ? `${pending} waiting for review` : ""].filter(Boolean);
    const sum = card.querySelector(".r-fc-sum")!;
    if (parts.length) sum.replaceChildren(svg("factCheck"), parts.join(", "));
    if (list.length) {
      const det = el("details", {}, el("summary", { class: "pw-link" }, `See the ${list.length === 1 ? "check" : `${list.length} checks`}`), el("ul", { class: "r-checks" }, ...list.map((c) => checkItem(c, r.lastChecked))));
      card.querySelector(".r-fc-body")!.append(det);
    }
  }
}

// The rules still being checked, in every country: where help matters most.
const needHelp = [
  ...rulesFor(null).rules.filter((r) => r.status !== "verified").map((r) => ({ c: null as string | null, r })),
  ...COUNTRIES.flatMap((c) => c.overrides.filter((r) => r.status !== "verified").map((r) => ({ c: c.country as string | null, r }))),
];

const tabs = el("nav", { class: "r-tabs", attrs: { "aria-label": "Rules for" } },
  el("a", { href: "/rules", ...(country ? {} : { attrs: { "aria-current": "page" } }) }, "EU"),
  ...COUNTRIES.map((c) => el("a", { href: `/rules?c=${c.country}`, ...(country === c.country ? { attrs: { "aria-current": "page" } } : {}) }, c.name)),
);

const net = (href: string, title: string, text: string) => el("a", { href, target: "_blank", rel: "noopener" }, el("b", {}, title), el("span", {}, text));

const main = el("main", { id: "main" },
  el("section", { class: "r-hero" },
    el("h1", {}, "Travel rules, ", el("em", {}, "checked in the open.")),
    el("p", {}, "Every rule PawID uses for travelling in Europe with a dog, cat or ferret, with its official source and the date it was checked. Think one is wrong or out of date? Correct it with a source. Know it is right? Confirm it. HosPet.eu reviews each check."),
  ),
  needHelp.length ? el("section", { class: "pw-card r-sec" },
    el("h2", {}, el("span", { class: "pw-tile pw-tile-gold" }, svg("flag")), "Help check these first"),
    el("p", {}, "We could not confirm these on an official page yet. An official source settles them."),
    el("ul", { class: "r-help" }, ...needHelp.map(({ c, r }) => el("li", {}, el("a", { href: `/rules${c ? `?c=${c}` : ""}#rule-${c ?? "EU"}.${r.id}` }, el("b", {}, c ? countryName(c) ?? c : "EU"), el("span", {}, r.text.length > 110 ? `${r.text.slice(0, 108)}…` : r.text))))),
  ) : "",
  el("section", { class: "pw-card r-sec", id: "rules" },
    el("h2", {}, el("span", { class: "pw-tile" }, svg("scale")), country ? `Rules for ${countryName(country) ?? country}` : "EU rules"),
    tabs,
    el("p", {}, country ? `${countryName(country) ?? country}'s own rules, then the EU rules that also apply.` : "The rules for every EU country. Pick a country to see its own rules too."),
    ...(country
      ? [el("ul", { class: "r-list" }, ...data.rules.filter((r) => r.scope !== "eu").map(ruleCard)),
         el("details", { class: "r-eu", id: "eu-rules", ...(location.hash.startsWith("#rule-EU.") ? { open: true } : {}) },
           el("summary", { class: "pw-link" }, `The ${data.rules.filter((r) => r.scope === "eu").length} EU rules that also apply`),
           el("ul", { class: "r-list r-list-eu" }, ...data.rules.filter((r) => r.scope === "eu").map(ruleCard)))]
      : [el("ul", { class: "r-list" }, ...data.rules.map(ruleCard))]),
    el("p", { class: "pw-hint flush" }, data.disclaimer),
  ),
  el("section", { class: "pw-card r-sec", id: "how" },
    el("h2", {}, el("span", { class: "pw-tile" }, svg("factCheck")), "How a check is reviewed"),
    el("ol", { class: "r-steps" },
      el("li", {}, el("b", {}, "You send a source. "), "A check without the address of a page is not accepted."),
      el("li", {}, el("b", {}, "HosPet.eu reads the page. "), "Only official pages count for the rule: ministries, national authorities, EU law. Other pages help us find them."),
      el("li", {}, el("b", {}, "Accepted checks show on the rule. "), "With your name only if you chose so. Rejected ones are not shown."),
      el("li", {}, el("b", {}, "A correction changes the rule in the open. "), "The rule files are on GitHub, so every change and its source can be seen by anyone."),
    ),
  ),
  el("section", { class: "pw-card r-sec", id: "fact-checkers" },
    el("h2", {}, el("span", { class: "pw-tile" }, svg("users")), "For fact-checking organisations"),
    el("p", {}, "If you work for a fact-checking organisation, your checks can carry a \"Fact-checking organisation\" badge. We give it to members of the networks below, after checking the organisation with you. PawID has no partnership with these networks today: we would like to work with them."),
    el("div", { class: "r-nets" },
      net("https://efcsn.com", "EFCSN", "European Fact-Checking Standards Network"),
      net("https://edmo.eu", "EDMO", "European Digital Media Observatory and its national hubs"),
      net("https://www.poynter.org/ifcn/", "IFCN", "International Fact-Checking Network"),
    ),
    el("p", {}, "The rules are open data: ", el("a", { href: "https://pawid-api.hospet.workers.dev/v1/rules?country=FR", class: "pw-link", target: "_blank", rel: "noopener" }, "JSON for each country"), " and ", el("a", { href: "https://github.com/ovixis/pawid/tree/main/rules", class: "pw-link", target: "_blank", rel: "noopener" }, "the rule files on GitHub"), ". To work with us: ", el("a", { href: "mailto:info@hospet.eu?subject=PawID%20fact-checking", class: "pw-link" }, "info@hospet.eu"), "."),
  ),
);

document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, siteFooter());
revealOnScroll(document);
void loadChecks();
if (location.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "center" }));

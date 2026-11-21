// "Support PawID": a statement of support from vets, venues, associations and pet owners.
// HosPet.eu approves each one, then brings the numbers to European open source grants and to the
// Commission's work on a digital pet passport. No money, no account.
import { BY_HOSPET, countryName } from "@pawid/ui";
import { COUNTRY_GROUPS } from "./countries";
import { button, el, revealOnScroll, siteFooter, svg, topBar } from "./dom";
import { moveToNewAddress } from "./move";
import { API } from "./pair";
import { injectStyles } from "./style";
import { humanCheck } from "./turnstile";

injectStyles();
moveToNewAddress();

const css = document.createElement("style");
css.textContent = `
.s-hero { color: #fff; display: grid; gap: .75rem; }
.s-hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.8vw, 2.625rem); line-height: 1.06; font-weight: 800; letter-spacing: -.035em; text-wrap: balance; }
.s-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.s-hero p { margin: 0; color: rgb(255 255 255 / .86); max-width: 40rem; }
.s-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .5rem; }
.s-stats[hidden] { display: none; }
.s-stat { display: grid; gap: .125rem; padding: .75rem .625rem; text-align: center; }
@media (min-width: 40rem) { .s-stat { padding: 1rem; } }
.s-stat b { font-size: clamp(1.375rem, 1.1rem + 1vw, 2rem); line-height: 1; font-weight: 800; letter-spacing: -.03em; color: var(--pw-navy-800); font-variant-numeric: tabular-nums; }
.s-stat span { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); font-weight: 600; }
.s-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .s-sec { padding: 1.5rem; } }
.s-sec > * { min-width: 0; }
.s-sec h2 { margin: 0; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.s-why { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.s-why li { display: grid; grid-template-columns: 2.75rem 1fr; gap: .875rem; align-items: start; }
.s-why b { display: block; }
.s-why span { color: var(--pw-ink-muted); }
.s-roles { display: flex; flex-wrap: wrap; gap: .5rem; border: 0; margin: 0; padding: 0; }
.s-roles legend { padding: 0; margin-bottom: .375rem; }
.s-roles label { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.5rem; padding: 0 .875rem; border-radius: 9999px; background: var(--pw-surface); box-shadow: var(--pw-shadow-raised); font-weight: 600; cursor: pointer; }
.s-roles label:has(input:checked) { background: var(--pw-navy-800); color: #fff; }
.s-roles input { accent-color: var(--pw-gold-500); }
.s-hp { position: absolute; left: -9999px; width: 1px; height: 1px; overflow: hidden; }
.s-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .625rem; }
.s-list li { padding: .875rem 1rem; border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); }
.s-list b { display: block; }
.s-list small { color: var(--pw-ink-subtle); }
.s-list p { margin: .375rem 0 0; color: var(--pw-ink-muted); }
.s-thanks { display: grid; justify-items: center; text-align: center; gap: .5rem; padding: 2rem 1.25rem; }
.s-thanks .pw-icon { width: 3rem; height: 3rem; color: var(--pw-ok); }
`;
document.head.append(css);

const ROLE: Record<string, string> = { owner: "Pet owner", vet: "Vet", venue: "Hotel, restaurant or place to visit", association: "Association or institution", developer: "Developer", other: "Other" };
const PLURAL: Record<string, string> = { owner: "pet owners", vet: "vets", venue: "venues", association: "associations" };

interface Numbers { total: number; countries: number; roles: Record<string, number>; statements: { name: string; role: string; country: string; organization?: string; message?: string; day: string }[] }

const stat = (n: number, label: string) => el("div", { class: "pw-card s-stat" }, el("b", {}, String(n)), el("span", {}, label));
const statsBox = el("div", { class: "s-stats", hidden: true, attrs: { "aria-live": "polite" } });
const listBox = el("ul", { class: "s-list" });
const listSec = el("section", { class: "pw-card s-sec", hidden: true }, el("h2", {}, "Who supports PawID"), listBox);

async function loadNumbers(): Promise<void> {
  try {
    const r = await fetch(`${API}/v1/support`, { credentials: "omit" });
    const d = (await r.json()) as Numbers;
    statsBox.hidden = d.total === 0;
    statsBox.replaceChildren(stat(d.total, d.total === 1 ? "supporter" : "supporters"), stat(d.roles.vet ?? 0, PLURAL.vet!), stat(d.roles.venue ?? 0, PLURAL.venue!), stat(d.countries, d.countries === 1 ? "country" : "countries"));
    listBox.replaceChildren(...d.statements.map((s) => el("li", {},
      el("b", {}, s.name, s.organization ? `, ${s.organization}` : ""),
      el("small", {}, `${ROLE[s.role] ?? s.role}, ${countryName(s.country) ?? s.country}`),
      s.message ? el("p", {}, s.message) : "",
    )));
    listSec.hidden = d.statements.length === 0;
  } catch {
    statsBox.replaceChildren(el("p", { class: "pw-hint" }, "The numbers could not be loaded right now."));
  }
}

function form(): HTMLElement {
  const name = el("input", { name: "name", required: true, minLength: 2, maxLength: 100, autocomplete: "name", id: "s-name", class: "pw-input" });
  const roles = el("fieldset", { class: "s-roles" }, el("legend", { class: "pw-label" }, "I am"),
    ...Object.entries(ROLE).map(([v, l], i) => el("label", {}, el("input", { type: "radio", name: "role", value: v, required: true, checked: i === 0 }), l)));
  const country = el("select", { name: "country", id: "s-country", class: "pw-input" }, ...COUNTRY_GROUPS.map((g) => el("optgroup", { label: g.label }, ...g.items.map((c) => el("option", { value: c.code, selected: c.code === "IT" }, c.name)))));
  const org = el("input", { name: "organization", maxLength: 120, autocomplete: "organization", id: "s-org", class: "pw-input" });
  const msg = el("textarea", { name: "message", maxLength: 280, rows: 3, id: "s-msg", class: "pw-input" });
  const email = el("input", { name: "email", type: "email", maxLength: 200, autocomplete: "email", id: "s-email", class: "pw-input" });
  const pub = el("input", { type: "checkbox", name: "public", checked: true });
  const hp = el("input", { name: "website", tabIndex: -1, autocomplete: "off", attrs: { "aria-hidden": "true" } });
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const tsBox = el("div", { class: "ts-box" });
  const human = humanCheck(tsBox);
  const go = button("Add my name", { kind: "primary", type: "submit", icon: "check" });
  const f = el("form", { class: "stack" },
    el("div", {}, el("label", { class: "pw-label", htmlFor: "s-name" }, "Your name"), name),
    roles,
    el("div", { class: "fields fields-2" },
      el("div", {}, el("label", { class: "pw-label", htmlFor: "s-country" }, "Country"), country),
      el("div", {}, el("label", { class: "pw-label", htmlFor: "s-org" }, "Organisation (optional)"), org),
    ),
    el("div", {}, el("label", { class: "pw-label", htmlFor: "s-msg" }, "Why PawID matters to you (optional)"), msg),
    el("div", {}, el("label", { class: "pw-label", htmlFor: "s-email" }, "Email (optional)"), email, el("p", { class: "pw-hint flush" }, "Only if we may write to you about PawID. Never shown, never shared.")),
    el("label", { class: "check" }, pub, el("span", {}, el("b", {}, "Show my name on this page"), el("span", {}, "With your role, country, organisation and message. Otherwise we only count you."))),
    el("label", { class: "s-hp" }, "Leave empty", hp),
    tsBox,
    err,
    el("div", { class: "bar" }, go),
    el("p", { class: "pw-hint flush" }, "HosPet.eu checks each statement before it counts. ", el("a", { href: "https://github.com/ovixis/pawid/blob/main/PRIVACY.md", class: "pw-link" }, "Privacy"), "."),
  );
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    if (!f.reportValidity()) return;
    go.disabled = true;
    try {
      const turnstile = await human.token();
      const role = (f.querySelector<HTMLInputElement>('input[name="role"]:checked')?.value) ?? "other";
      const r = await fetch(`${API}/v1/support`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "omit",
        body: JSON.stringify({ name: name.value.trim(), role, country: country.value, organization: org.value.trim() || undefined, message: msg.value.trim() || undefined, email: email.value.trim() || undefined, public: pub.checked, website: hp.value, turnstile }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Something went wrong. Try again.");
      f.replaceWith(el("div", { class: "s-thanks", attrs: { role: "status" } }, svg("checkCircleFill"),
        el("h2", {}, `Thank you, ${name.value.trim().split(" ")[0]}.`),
        el("p", { class: "pw-hint" }, "We check each statement, usually within a few days. Then it counts here.")));
    } catch (x) {
      err.textContent = (x as Error).message;
      human.reset();
    } finally {
      go.disabled = false;
    }
  });
  return f;
}

const why = (icon: Parameters<typeof svg>[0], title: string, text: string) =>
  el("li", {}, el("span", { class: "pw-tile" }, svg(icon)), el("div", {}, el("b", {}, title), el("span", {}, text)));

const main = el("main", { id: "main" },
  el("section", { class: "s-hero" },
    el("h1", {}, "Help keep PawID ", el("em", {}, "free and open.")),
    el("p", {}, "PawID costs nothing to use and its code is open. To keep it that way, we apply for European funding for open source software, and we will answer the European Commission when it asks for views on a digital pet passport. Your name shows them that vets, venues and pet owners want this."),
  ),
  statsBox,
  el("section", { class: "pw-card s-sec", id: "add" }, el("h2", {}, "Add your name"), form()),
  el("section", { class: "pw-card s-sec" },
    el("h2", {}, "What we do with it"),
    el("ul", { class: "s-why" },
      why("heartHandshake", "European open source grants", "Funding programmes for open source ask who needs the project. Your statement is the answer."),
      why("idcard", "The EU digital pet passport", "The Commission will assess a digital pet passport by mid 2028. We will share how many vets, venues and owners already use and support PawID."),
      why("stethoscope", "Vets' and venues' associations", "We show the numbers to vet associations and tourism bodies, to start pilots."),
    ),
    el("p", { class: "pw-hint flush" }, "We do not ask for money. We never sell or share emails."),
  ),
  listSec,
);
document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, siteFooter());
void loadNumbers();
revealOnScroll(document);

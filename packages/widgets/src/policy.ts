import { longDate } from "@pawid/ui";
import { PawidElement, byLine, h } from "./base";

/**
 * <pawid-policy> The venue's own pet rules, in the HosPet look.
 *
 * <pawid-policy>
 *   <script type="application/json">{ "name": "Trattoria Da Rosa", "dogs": "yes", ... }</script>
 * </pawid-policy>
 *
 * Everything shown is declared by the venue. PawID does not check it.
 */
type Answer = "yes" | "conditions" | "no";

export interface VenuePolicy {
  name: string;
  dogs?: Answer;
  cats?: Answer;
  /** Largest dog accepted, in kg. */
  maxWeightKg?: number;
  maxPets?: number;
  fee?: string;
  /** Where pets may go: free words such as "rooms", "restaurant", "terrace", "garden", "exhibition halls". */
  where?: string[];
  /** Hotels: may the pet stay alone in the room. */
  aloneInRoom?: Answer;
  /** What the venue asks at arrival: "microchip", "rabies", "pawid", "leash", "muzzle", or free words. */
  ask?: string[];
  notes?: string;
  /** YYYY-MM-DD the venue last checked this. */
  updated?: string;
  /** Link to the venue's own page with the full rules. */
  link?: string;
}

const ANSWERS: Answer[] = ["yes", "conditions", "no"];
const ANSWER_PILL: Record<Answer, [string, string]> = {
  yes: ["Welcome", "pw-status-ok"],
  conditions: ["With conditions", "pw-status-warn"],
  no: ["Not allowed", "pw-status-no"],
};
const ALONE: Record<Answer, [string, string]> = {
  yes: ["Allowed", "pw-status-ok"],
  conditions: ["With conditions", "pw-status-warn"],
  no: ["Not allowed", "pw-status-no"],
};
const ASK_WORDS: Record<string, string> = {
  microchip: "Microchip",
  rabies: "Valid rabies vaccine",
  pawid: "PawID card or the pet passport",
  passport: "EU pet passport",
  leash: "Leash at all times",
  muzzle: "Muzzle when asked",
};

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
const answer = (v: unknown) => (ANSWERS.includes(v as Answer) ? (v as Answer) : undefined);
const list = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => str(x, 60)).filter((x): x is string => Boolean(x)).slice(0, max) : undefined);
const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && v >= lo && v <= hi ? v : undefined);

/** Reads and trims whatever the venue wrote. Unknown fields are ignored, nothing is executed. */
export function readPolicy(raw: unknown): VenuePolicy | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const name = str(o.name, 100);
  if (!name) return null;
  const link = str(o.link, 300);
  return {
    name,
    dogs: answer(o.dogs),
    cats: answer(o.cats),
    maxWeightKg: num(o.maxWeightKg, 1, 150),
    maxPets: num(o.maxPets, 1, 20),
    fee: str(o.fee, 80),
    where: list(o.where, 12),
    aloneInRoom: answer(o.aloneInRoom),
    ask: list(o.ask, 10),
    notes: str(o.notes, 500),
    updated: typeof o.updated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.updated) ? o.updated : undefined,
    link: link && /^https:\/\//.test(link) ? link : undefined,
  };
}

export class PawidPolicy extends PawidElement {
  protected readonly component = "policy";

  protected extraCss(): string {
    return `
dl { margin: 0; display: grid; }
.r { display: grid; grid-template-columns: minmax(0, 6.5rem) minmax(0, 1fr); gap: .75rem; padding: .625rem 0; border-top: 1px solid var(--pw-line); align-items: center; }
.r:first-child { border-top: 0; }
@container (min-width: 30rem) { .r { grid-template-columns: minmax(0, 9rem) minmax(0, 1fr); } }
dt { color: var(--pw-ink-muted); }
dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.chips { display: flex; flex-wrap: wrap; gap: .375rem; }
.chip { display: inline-flex; align-items: center; height: 1.75rem; padding: 0 .7rem; border-radius: 9999px; background: var(--pw-surface-muted); font-size: .8125rem; font-weight: 700; }
ul { margin: 0; padding-left: 1.1rem; }
li { margin: .125rem 0; }
.foot { display: grid; gap: .5rem; padding-top: .25rem; border-top: 1px solid var(--pw-line); }
`;
  }

  static get observedAttributes() {
    return ["with-button"];
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  private observer: MutationObserver | null = null;

  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.observer = null;
  }

  protected render(): void {
    // The JSON may arrive after the element (parsers and frameworks that add children later).
    if (!this.observer) {
      this.observer = new MutationObserver(() => this.render());
      this.observer.observe(this, { childList: true, subtree: true, characterData: true });
    }
    const script = this.querySelector('script[type="application/json"]');
    let policy: VenuePolicy | null = null;
    try { policy = readPolicy(JSON.parse(script?.textContent ?? "null")); } catch { policy = null; }
    if (!policy) {
      this.show(h("div", { class: "pw-card box" }, h("p", { class: "pw-error" }, 'PawID pet policy: add a <script type="application/json"> with at least a "name".')));
      return;
    }
    const p = policy;
    const pill = (a: Answer, map: Record<Answer, [string, string]>) => h("span", { class: `pw-status ${map[a][1]}` }, map[a][0]);
    const row = (label: string, value: Node | string) => h("div", { class: "r" }, h("dt", {}, label), h("dd", {}, value));

    const rows: Node[] = [];
    if (p.dogs) rows.push(row("Dogs", pill(p.dogs, ANSWER_PILL)));
    if (p.cats) rows.push(row("Cats", pill(p.cats, ANSWER_PILL)));
    if (p.maxWeightKg) rows.push(row("Size", `Up to ${p.maxWeightKg} kg`));
    if (p.maxPets) rows.push(row("How many", p.maxPets === 1 ? "One pet" : `Up to ${p.maxPets} pets`));
    if (p.fee) rows.push(row("Fee", p.fee));
    if (p.where?.length) rows.push(row("Where", h("span", { class: "chips" }, ...p.where.map((w) => h("span", { class: "chip" }, w)))));
    if (p.aloneInRoom) rows.push(row("Alone in the room", pill(p.aloneInRoom, ALONE)));

    const parts: Node[] = [
      h("h2", { class: "title" }, `Pets at ${p.name}`),
      rows.length ? h("dl", {}, ...rows) : h("p", { class: "muted" }, "No details given yet."),
    ];
    if (p.ask?.length) {
      parts.push(h("div", {}, h("p", { class: "pw-label" }, "What we ask"), h("ul", {}, ...p.ask.map((a) => h("li", {}, ASK_WORDS[a] ?? a)))));
    }
    if (p.notes) parts.push(h("p", {}, p.notes));

    const foot = h("div", { class: "foot" });
    if (this.hasAttribute("with-button")) {
      const url = `${this.app}/#/share?venue=${encodeURIComponent(p.name)}&days=7`;
      foot.append(h("div", { class: "row" }, h("a", { class: "pw-btn pw-btn-primary", href: url, target: "_blank", rel: "noopener" }, "Show your pet's PawID")));
    }
    foot.append(
      h("p", { class: "muted" }, `Rules set by ${p.name}`, p.updated ? `, checked ${longDate(p.updated)}` : "", ".", p.link ? " " : "", p.link ? h("a", { class: "pw-link", href: p.link, target: "_blank", rel: "noopener" }, "Full rules") : ""),
      byLine(),
    );
    parts.push(foot);
    this.show(h("section", { class: "pw-card box", "aria-label": `Pet policy of ${p.name}` }, ...parts));
  }
}

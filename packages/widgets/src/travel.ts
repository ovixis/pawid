import { countryName, longDate } from "@pawid/ui";
import { PawidElement, byLine, h } from "./base";

/**
 * <pawid-travel-check country="IT">
 * For museums, tourism boards, institutions and places to visit: what a dog needs to come
 * to this country, from PawID's rules. Each rule shows its official source and last check.
 * Rules still marked needs_review say so: we never present them as confirmed.
 */
interface Rule { id: string; text: string; status: "verified" | "needs_review"; sources: string[]; lastChecked: string; scope: "eu" | "country" }
interface Rules { country: string | null; countryCovered: boolean; rules: Rule[]; disclaimer: string; lastChecked: string }

export class PawidTravelCheck extends PawidElement {
  protected readonly component = "travel";
  private loaded = "";

  protected extraCss(): string {
    return `
ol { list-style: none; margin: 0; padding: 0; display: grid; }
li { display: grid; gap: .375rem; padding: .875rem 0; border-top: 1px solid var(--pw-line); }
li:first-child { border-top: 0; }
.src { display: flex; flex-wrap: wrap; gap: .25rem .75rem; font-size: var(--pw-text-xs); }
.src a { color: var(--pw-navy-700); font-weight: 600; text-underline-offset: 2px; }
details > summary { cursor: pointer; font-weight: 700; color: var(--pw-navy-700); min-height: 2.75rem; display: flex; align-items: center; }
`;
  }

  static get observedAttributes() {
    return ["country"];
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  protected render(): void {
    const raw = (this.getAttribute("country") ?? "").trim().toUpperCase();
    const country = /^[A-Z]{2}$/.test(raw) ? raw : "";
    const key = `${this.api}|${country}`;
    if (this.loaded === key) return;
    this.loaded = key;
    const place = country ? countryName(country) ?? country : "the EU";
    this.show(h("div", { class: "pw-card box", "aria-busy": "true" }, h("p", { class: "muted" }, `Loading the rules for ${place}…`)));
    fetch(`${this.api}/v1/rules${country ? `?country=${country}` : ""}`, { credentials: "omit" })
      .then((r) => (r.ok ? (r.json() as Promise<Rules>) : Promise.reject(new Error(String(r.status)))))
      .then((data) => { if (this.loaded === key) this.draw(data, place); })
      .catch(() => {
        if (this.loaded !== key) return;
        this.loaded = "";
        this.show(h("div", { class: "pw-card box" }, h("p", { class: "pw-error" }, "The travel rules could not be loaded. Try again later."), byLine()));
      });
  }

  private draw(data: Rules, place: string): void {
    const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return "source"; } };
    const items = data.rules.map((r) =>
      h("li", {},
        h("span", { class: `pw-status ${r.status === "verified" ? "pw-status-ok" : "pw-status-warn"}` }, r.status === "verified" ? `Checked ${longDate(r.lastChecked)}` : "Being checked: see the source"),
        h("p", {}, r.text),
        h("p", { class: "src" }, "Source:", ...r.sources.map((s) => h("a", { href: /^https:\/\//.test(s) ? s : "#", target: "_blank", rel: "noopener" }, host(s)))),
      ),
    );
    const verified = items.filter((_, i) => data.rules[i]!.status === "verified");
    const review = items.filter((_, i) => data.rules[i]!.status !== "verified");
    this.show(
      h("section", { class: "pw-card box", "aria-label": `Travelling to ${place} with a dog` },
        h("h2", { class: "title" }, `Coming to ${place} with your dog`),
        data.country && !data.countryCovered
          ? h("p", { class: "pw-notice" }, `These are the EU rules. PawID has not checked ${place}'s own rules yet: also look at the national authority's page.`)
          : null,
        h("ol", {}, ...verified),
        review.length
          ? h("details", {}, h("summary", {}, `${review.length} more ${review.length === 1 ? "rule" : "rules"} being checked`), h("ol", {}, ...review))
          : null,
        h("p", { class: "muted" }, data.disclaimer),
        byLine(),
      ),
    );
  }
}

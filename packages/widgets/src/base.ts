import { COMPONENTS, TOKENS, BY_HOSPET } from "@pawid/ui";

export const DEFAULT_API = "https://pawid-api.hospet.workers.dev";
export const DEFAULT_APP = "https://pawid.pages.dev";

/**
 * Styles inside every component. The venue's font is used (font-family: inherit).
 * Theming: the venue sets --pawid-accent (and --pawid-accent-ink for dark colours)
 * anywhere on its page; we read it through our own --pw-accent with HosPet gold as the fallback.
 */
export const WIDGET_CSS = `${TOKENS}
:host {
  --pw-accent: var(--pawid-accent, #f5b800);
  --pw-accent-ink: var(--pawid-accent-ink, #16181d);
  --pw-font: inherit;
  display: block;
  container-type: inline-size;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
  line-height: 1.6;
  text-align: start;
}
:host([hidden]) { display: none; }
*, *::before, *::after { box-sizing: border-box; }
h2, h3, p { margin: 0; }
img, svg, video, canvas { display: block; }
.pw-icon { display: inline-block; }
${COMPONENTS}
.box { padding: 1.25rem; display: grid; gap: .875rem; }
@container (min-width: 36rem) { .box { padding: 1.5rem; } }
.title { font-size: var(--pw-text-lg); font-weight: 800; letter-spacing: -.015em; line-height: 1.3; }
.muted { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.by { font-size: .8125rem; color: var(--pw-ink-subtle); }
.by a { color: inherit; }
.flush { padding: 0; }
`;

const counted = new Set<string>();

/** One anonymous count per component type per page load: which site uses which component. */
export function countLoad(api: string, component: string): void {
  if (counted.has(component)) return;
  // Our own demo pages are not a venue using PawID.
  if (/(^|\.)pawid\.pages\.dev$|^localhost$|^127\.0\.0\.1$/.test(location.hostname)) return;
  counted.add(component);
  try {
    fetch(`${api}/v1/w?c=${encodeURIComponent(component)}`, { mode: "cors", credentials: "omit", keepalive: true }).catch(() => {});
  } catch { /* offline or blocked: not counted */ }
}

/** Builds elements with textContent only. Data from the venue or the API never goes through innerHTML here. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") node.className = String(v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v as EventListener);
    else if (k in node && typeof v !== "string") (node as unknown as Record<string, unknown>)[k] = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

export function byLine(): HTMLElement {
  return h("p", { class: "by" }, h("a", { href: BY_HOSPET.href, target: "_blank", rel: "noopener" }, BY_HOSPET.text), ". Not an official document.");
}

export abstract class PawidElement extends HTMLElement {
  protected root: ShadowRoot;
  protected abstract readonly component: string;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    // Constructed stylesheets are not blocked by a venue's strict style-src CSP; <style> is the fallback.
    const css = WIDGET_CSS + this.extraCss();
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      this.root.adoptedStyleSheets = [sheet];
    } catch {
      const style = document.createElement("style");
      style.textContent = css;
      this.root.append(style);
    }
  }

  protected extraCss(): string {
    return "";
  }

  get api(): string {
    return (this.getAttribute("api") ?? DEFAULT_API).replace(/\/+$/, "");
  }
  get app(): string {
    return (this.getAttribute("app") ?? DEFAULT_APP).replace(/\/+$/, "");
  }

  /** Replaces everything but the style element. */
  protected show(...nodes: Node[]): void {
    const style = this.root.querySelector(":scope > style");
    this.root.replaceChildren(...(style ? [style] : []), ...nodes);
  }

  connectedCallback(): void {
    countLoad(this.api, this.component);
    this.render();
  }

  protected abstract render(): void;
}

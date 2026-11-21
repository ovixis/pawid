import { ICON_BODIES, hospetMark, pawidMark, type IconName } from "@pawid/ui";

type Props<K extends keyof HTMLElementTagNameMap> = Partial<Omit<HTMLElementTagNameMap[K], "style">> & {
  class?: string;
  attrs?: Record<string, string>;
};

/** Builds elements with textContent only. User data never goes through innerHTML here. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props<K> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  const { class: cls, attrs, ...rest } = props;
  if (cls) node.className = cls;
  Object.assign(node, rest);
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) if (c !== null && c !== undefined && c !== false) node.append(c);
  return node;
}

/** Icon from our generated set: a fixed string, never user data. */
export function svg(name: IconName, label?: string): SVGSVGElement {
  const ns = "http://www.w3.org/2000/svg";
  const s = document.createElementNS(ns, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "pw-icon");
  if (label) { s.setAttribute("role", "img"); s.setAttribute("aria-label", label); } else s.setAttribute("aria-hidden", "true");
  s.innerHTML = ICON_BODIES[name];
  return s;
}

export function button(label: string, opts: { kind?: "primary" | "secondary" | "ghost" | "dark"; icon?: IconName; sm?: boolean; onClick?: () => void; type?: "button" | "submit" } = {}): HTMLButtonElement {
  const b = el("button", { type: opts.type ?? "button", class: `pw-btn pw-btn-${opts.kind ?? "secondary"}${opts.sm ? " pw-btn-sm" : ""}` });
  if (opts.icon) b.append(svg(opts.icon));
  b.append(label);
  if (opts.onClick) b.addEventListener("click", opts.onClick);
  return b;
}

export function link(label: string, href: string, kind: "primary" | "secondary" | "ghost" | "dark" = "secondary", icon?: IconName): HTMLAnchorElement {
  const a = el("a", { href, class: `pw-btn pw-btn-${kind}` });
  if (icon) a.append(svg(icon));
  a.append(label);
  return a;
}

export const today = () => new Date().toISOString().slice(0, 10);

/** The PawID or HosPet mark (fixed markup from @pawid/ui/brand, never user data). Decorative: the name is next to it. */
export function brandMark(which: "pawid" | "hospet", cls = "pw-mark"): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = "mark-wrap";
  s.innerHTML = which === "pawid" ? pawidMark(undefined, cls) : hospetMark(undefined, cls);
  return s;
}

/** Header: the PawID logo on the left, "by HosPet.eu" with the HosPet mark on the right. */
export function topBar(home: string, byHref: string): HTMLElement {
  return el(
    "header",
    { class: "top" },
    el("div", { class: "top-in" },
      el("a", { href: home, class: "logo", attrs: { "aria-label": "PawID home" } }, brandMark("pawid", "pw-mark logo-mark"), el("span", {}, "Paw", el("span", { class: "logo-id" }, "ID"))),
      el("a", { href: byHref, class: "by", rel: "noopener" }, "by", brandMark("hospet", "pw-mark by-mark"), el("b", {}, "HosPet.eu")),
    ),
  );
}

const API_DOCS = "https://pawid-api.hospet.workers.dev/v1/openapi.json";

/** The site footer, the same on every page: brand, three link columns, the not-official notice. */
export function siteFooter(): HTMLElement {
  const col = (title: string, links: [string, string][]) =>
    el("nav", { class: "f-col", attrs: { "aria-label": title } },
      el("h2", {}, title),
      el("ul", {}, ...links.map(([text, href]) => el("li", {}, el("a", { href, ...(href.startsWith("http") ? { rel: "noopener" } : {}) }, text)))),
    );
  return el(
    "footer",
    { class: "site-foot" },
    el("div", { class: "f-in" },
      el("div", { class: "f-brand" },
        el("a", { href: "/", class: "f-logo" }, brandMark("pawid", "pw-mark f-mark"), "PawID"),
        el("p", {}, "Open source companion for the EU pet passport, for people who travel in Europe with a dog or a cat."),
        el("a", { href: "https://hospet.eu", class: "f-by", rel: "noopener" }, "by", brandMark("hospet", "pw-mark f-hmark"), el("b", {}, "HosPet.eu")),
      ),
      el("div", { class: "f-cols" },
        col("App", [["Open PawID", "/"], ["Install the app", "/install"], ["How to use it", "/install#guide"], ["For vets", "/vet"]]),
        col("For places", [["Components", "/venues"], ["Where it works", "/venues#places"], ["For developers", "/venues#developers"]]),
        col("Project", [["GitHub: contribute", "https://github.com/ovixis/pawid"], ["API description", API_DOCS], ["Privacy", "https://github.com/ovixis/pawid/blob/main/PRIVACY.md"], ["HosPet.eu", "https://hospet.eu"]]),
      ),
      el("p", { class: "f-notice" }, svg("info"), el("span", {}, el("b", {}, "Not an official document. "), "The EU pet passport, issued by an authorised vet, is. Always carry it when you travel.")),
      el("div", { class: "f-base" },
        el("span", {}, `© ${new Date().getFullYear()} HosPet.eu`),
        el("span", {}, "Apache-2.0"),
        el("span", {}, "Made in Europe"),
        el("span", {}, "No cookies, no account"),
      ),
    ),
  );
}

/** Marketing pages: sections ease in as they reach the screen. Without JS or with reduced motion they are simply there. */
export function revealOnScroll(root: ParentNode, selector = "main > section, main > .pw-card"): void {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [...root.querySelectorAll<HTMLElement>(selector)];
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  for (const el of items) {
    el.classList.add("reveal");
    // Already on screen: show at once, no flash.
    if (el.getBoundingClientRect().top < innerHeight * 0.92) el.classList.add("in");
    else io.observe(el);
  }
  document.documentElement.classList.add("js-reveal");
}

// A code window: file name bar, highlighted code, Copy button, and a result line under the code.
// Highlighting builds text nodes only (no innerHTML), so the code shown is always plain text.
import { el, svg } from "./dom";

type Lang = "html" | "sh";
let uid = 0;

const HTML_RE = /<\/?[a-zA-Z][\w-]*|\/?>|"(?:[^"\\\n]|\\.)*"|[a-zA-Z][\w-]*(?==)|(?<=\s)[a-zA-Z][\w-]*(?=[\s>])/g;
const SH_RE = /#[^\n]*|"(?:[^"\\\n]|\\.)*"|'[^'\n]*'|(?<=^|\s)--?[a-zA-Z][\w-]*|\$[A-Z_]+|\\$|^\s*[a-z][\w-]*/gm;

function span(cls: string, text: string): HTMLElement {
  return el("span", { class: `t-${cls}` }, text);
}

/** Splits code into coloured spans. Small on purpose: HTML (with JSON inside) and shell. */
export function highlight(code: string, lang: Lang): Node[] {
  const out: Node[] = [];
  let last = 0;
  let inTag = false;
  const re = lang === "html" ? HTML_RE : SH_RE;
  re.lastIndex = 0;
  for (let m = re.exec(code); m; m = re.exec(code)) {
    const t = m[0];
    if (m.index > last) out.push(document.createTextNode(code.slice(last, m.index)));
    last = m.index + t.length;
    if (lang === "html") {
      if (t.startsWith("<")) { inTag = true; out.push(span("punct", t.match(/^<\/?/)![0]), span("tag", t.replace(/^<\/?/, ""))); }
      else if (t.endsWith(">")) { inTag = false; out.push(span("punct", t)); }
      else if (t.startsWith('"')) out.push(span("str", t));
      else out.push(inTag ? span("attr", t) : document.createTextNode(t));
    } else {
      if (t.startsWith("#")) out.push(span("com", t));
      else if (t.startsWith('"') || t.startsWith("'")) out.push(span("str", t));
      else if (t.startsWith("-")) out.push(span("flag", t));
      else if (t.startsWith("$")) out.push(span("var", t));
      else if (t === "\\") out.push(span("punct", t));
      else {
        const lead = t.match(/^\s*/)![0];
        if (lead) out.push(document.createTextNode(lead));
        out.push(span("cmd", t.slice(lead.length)));
      }
    }
  }
  if (last < code.length) out.push(document.createTextNode(code.slice(last)));
  return out;
}

export interface CodeWindowOptions {
  file: string;
  code: string;
  lang: Lang;
  /** What the copied code is, for screen readers: "Copy" + this. */
  what: string;
  /** The line under the code: a bold label (e.g. "200 OK") and a short note. */
  result?: { label: string; text: string };
}

const timers = new WeakMap<HTMLElement, number>();

async function copyText(button: HTMLElement, tip: HTMLElement, text: string): Promise<void> {
  let ok = true;
  try { await navigator.clipboard.writeText(text); } catch { ok = false; }
  clearTimeout(timers.get(button));
  button.toggleAttribute("data-copied", ok);
  button.toggleAttribute("data-failed", !ok);
  tip.textContent = "";
  requestAnimationFrame(() => (tip.textContent = ok ? "Copied" : "Copy failed, select the code by hand"));
  timers.set(button, window.setTimeout(() => {
    button.removeAttribute("data-copied");
    button.removeAttribute("data-failed");
    tip.textContent = "";
  }, 2000));
}

export function codeWindow(o: CodeWindowOptions): HTMLElement {
  const id = `code-${++uid}`;
  const tip = el("span", { class: "cw-tip", attrs: { role: "status" } });
  const label = el("span", { class: "cw-copy-label" }, "Copy");
  const button = el("button", { type: "button", class: "cw-copy" },
    el("span", { class: "cw-ic cw-ic-copy" }, svg("copy")),
    el("span", { class: "cw-ic cw-ic-done" }, svg("check")),
    label,
    el("span", { class: "pw-sr" }, ` ${o.what}`),
  );
  button.addEventListener("click", () => void copyText(button, tip, o.code));

  const code = el("code", { id }, ...highlight(o.code, o.lang));
  const pre = el("pre", { tabIndex: 0, attrs: { "aria-label": `${o.file}, ${o.what}` } }, code);
  return el(
    "figure",
    { class: "cw" },
    el("div", { class: "cw-bar" },
      el("span", { class: "cw-dots", attrs: { "aria-hidden": "true" } }, el("i"), el("i"), el("i")),
      el("figcaption", { class: "cw-file" }, o.file),
      el("span", { class: "cw-act" }, button, tip),
    ),
    pre,
    o.result
      ? el("p", { class: "cw-result" }, el("span", { class: "cw-dot", attrs: { "aria-hidden": "true" } }), el("b", {}, o.result.label), el("span", { attrs: { "aria-hidden": "true" } }, "·"), el("span", {}, o.result.text))
      : "",
  );
}

export const CODE_WINDOW_CSS = /* css */ `
.cw { margin: 0; color-scheme: dark; background: #101c33; color: #dbe3f0; border-radius: var(--pw-radius-card); overflow: hidden; box-shadow: 0 1px 0 rgb(255 255 255 / .06) inset, 0 12px 32px -12px rgb(13 23 43 / .45); min-width: 0; }
.cw-bar { display: flex; align-items: center; gap: .75rem; padding: .625rem .75rem .625rem 1rem; background: #14233f; border-bottom: 1px solid rgb(255 255 255 / .08); }
.cw-dots { display: flex; gap: .375rem; flex: none; }
.cw-dots i { width: .625rem; height: .625rem; border-radius: 50%; background: rgb(255 255 255 / .18); }
.cw-file { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: .8125rem/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; color: #9fb0cc; }
.cw-act { position: relative; flex: none; }
.cw-copy { display: inline-flex; align-items: center; gap: .375rem; min-inline-size: 2.75rem; min-block-size: 2.25rem; padding: 0 .75rem; border-radius: var(--pw-radius-control); border: 1px solid rgb(255 255 255 / .16); background: rgb(255 255 255 / .06); color: #e8eef8; font: inherit; font-size: .8125rem; font-weight: 600; cursor: pointer; }
.cw-copy:hover { background: rgb(255 255 255 / .12); }
.cw-copy:focus-visible { outline: 2px solid var(--pw-gold-400); outline-offset: 2px; }
.cw-copy .pw-icon { width: 1rem; height: 1rem; }
.cw-ic { display: inline-flex; }
.cw-ic-done, .cw-copy[data-copied] .cw-ic-copy { display: none; }
.cw-copy[data-copied] .cw-ic-done { display: inline-flex; color: #5ee0a6; }
.cw-copy[data-failed] { border-color: #f08a8a; }
.cw-tip { position: absolute; inset-block-start: calc(100% + .375rem); inset-inline-end: 0; padding: .25rem .5rem; border-radius: .375rem; background: #e8eef8; color: #14233f; font-size: .75rem; font-weight: 700; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity .15s; z-index: 1; }
.cw-tip:not(:empty) { opacity: 1; }
.cw pre { margin: 0; padding: 1.125rem 1.25rem; overflow-x: auto; font: .8125rem/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; tab-size: 2; }
.cw pre:focus-visible { outline: 2px solid var(--pw-gold-400); outline-offset: -2px; }
.cw-result { display: flex; align-items: center; flex-wrap: wrap; gap: .25rem .5rem; margin: 0; padding: .75rem 1.25rem; border-top: 1px solid rgb(255 255 255 / .08); background: #0c1629; font: .8125rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; color: #9fb0cc; }
.cw-result b { color: #5ee0a6; }
.cw-dot { width: .625rem; height: .625rem; border-radius: 50%; background: #5ee0a6; box-shadow: 0 0 0 3px rgb(94 224 166 / .2); flex: none; }
.t-tag, .t-flag { color: #7cc4ff; }
.t-attr, .t-cmd { color: #9fe0b5; }
.t-str { color: #ffd666; }
.t-com { color: #7f8ea8; }
.t-var { color: #f5a97f; }
.t-punct { color: #8a9ab5; }
@media (prefers-reduced-motion: reduce) { .cw-tip { transition: none; } }

.dev-points { list-style: none; margin: 0; padding: 0; display: grid; gap: .625rem; }
.dev-points li { display: grid; grid-template-columns: 1.75rem 1fr; gap: .75rem; align-items: center; }
.dev-points .pw-icon { width: 1.75rem; height: 1.75rem; padding: .375rem; border-radius: 50%; background: color-mix(in oklab, var(--pw-ok) 14%, transparent); color: var(--pw-ok); }
.dev-points span { color: var(--pw-ink-muted); }
.dev-points b { color: var(--pw-ink); }
`;

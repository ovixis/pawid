// "Install PawID": an install button where the browser allows it, steps for each phone, and a short guide.
import { BY_HOSPET, type IconName } from "@pawid/ui";
import { el, svg, topBar, siteFooter } from "./dom";
import { SHOWCASE_CSS, phoneRow } from "./showcase";
import { injectStyles } from "./style";

injectStyles();

const css = document.createElement("style");
css.textContent = `${SHOWCASE_CSS}
.i-hero { background: var(--pw-navy-800); color: #fff; border-radius: var(--pw-radius-card); padding: 1.75rem 1.5rem; display: grid; gap: .75rem; }
.i-hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.6vw, 2.5rem); line-height: 1.08; font-weight: 800; letter-spacing: -.03em; }
.i-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.i-hero p { margin: 0; color: rgb(255 255 255 / .85); max-width: 40rem; }
.i-hero .row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.i-hero .i-ghost { color: #fff; }
.i-hero [role="status"] { color: #fff; font-weight: 600; }
.i-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .i-sec { padding: 1.5rem; } }
.i-sec > * { min-width: 0; }
.i-sec h2 { margin: 0; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.i-sec > p { margin: 0; color: var(--pw-ink-muted); }
.os { border-radius: var(--pw-radius-card); box-shadow: inset 0 0 0 1px var(--pw-line); background: var(--pw-canvas); }
.os summary { display: flex; align-items: center; gap: .75rem; min-height: 3.25rem; padding: .5rem 1rem; cursor: pointer; font-weight: 800; list-style: none; }
.os summary::-webkit-details-marker { display: none; }
.os summary::after { content: "+"; margin-left: auto; color: var(--pw-ink-muted); font-weight: 600; }
.os[open] summary::after { content: "\\2212"; }
.os-ic { display: grid; place-items: center; flex: none; width: 2.5rem; height: 2.5rem; border-radius: .75rem; color: #fff; }
.os-ic .pw-icon { width: 1.5rem; height: 1.5rem; }
.os-ic-iphone { background: #16181d; }
.os-ic-iphone .pw-icon { margin-top: -.125rem; }
.os-ic-android { background: #3ddc84; color: #073d22; }
.os-ic-computer { background: var(--pw-navy-800); color: var(--pw-gold-400); }
.os summary small { font-weight: 500; color: var(--pw-ink-muted); }
.os ol { margin: 0; padding: 0 1rem 1rem; list-style: none; counter-reset: s; display: grid; gap: .75rem; }
.os li { counter-increment: s; display: grid; grid-template-columns: 2rem 1fr; gap: .75rem; align-items: start; }
.os li::before { content: counter(s); display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 9999px; background: var(--pw-gold-100); color: var(--pw-navy-800); font-weight: 800; }
.os li span { padding-top: .25rem; }
.os .key { display: inline-flex; align-items: center; gap: .25rem; padding: 0 .375rem; border-radius: .375rem; background: var(--pw-surface); box-shadow: inset 0 0 0 1px var(--pw-line); font-weight: 700; white-space: nowrap; }
.os .key .pw-icon { width: 1rem; height: 1rem; }
.os .pw-notice { margin: 0 1rem 1rem; }
.guide { list-style: none; margin: 0; padding: 0; display: grid; gap: .75rem; }
.guide li { display: grid; grid-template-columns: 2.5rem 1fr; gap: .75rem; align-items: start; }
.guide .g-ic { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: .75rem; background: var(--pw-navy-800); color: var(--pw-gold-400); }
.guide b { display: block; }
.guide span { color: var(--pw-ink-muted); }
.i-notes { margin: 0; padding-left: 1.1rem; color: var(--pw-ink-muted); display: grid; gap: .375rem; }
`;
document.head.append(css);

/* ---------- Install button (only where the browser can install from the page) ---------- */

interface InstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> }
type NavWithInstall = Navigator & { install?: () => Promise<unknown> };

const status = el("p", { attrs: { role: "status" } });
const installBtn = el("button", { type: "button", class: "pw-btn pw-btn-primary", hidden: true }, svg("download"), "Install PawID");
const supportsWebInstall = typeof (Navigator.prototype as NavWithInstall).install === "function";
let deferred: InstallPromptEvent | undefined;
if (supportsWebInstall) installBtn.hidden = false;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e as InstallPromptEvent;
  if (!supportsWebInstall) installBtn.hidden = false;
});
window.addEventListener("appinstalled", () => {
  installBtn.hidden = true;
  status.textContent = "PawID is installed. Find it on your home screen.";
});

installBtn.addEventListener("click", async () => {
  if (installBtn.getAttribute("aria-disabled") === "true") return;
  installBtn.setAttribute("aria-disabled", "true"); // not disabled: keeps focus on the button
  try {
    if (supportsWebInstall) {
      await (navigator as NavWithInstall).install!();
      status.textContent = "PawID is installed, or opened if it already was.";
      installBtn.hidden = true;
    } else if (deferred) {
      const ev = deferred;
      deferred = undefined; // single use
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      status.textContent = outcome === "accepted" ? "PawID is installed. Find it on your home screen." : "Not installed. You can do it later from here.";
      if (!deferred) installBtn.hidden = true;
    }
  } catch (err) {
    status.textContent = (err as DOMException).name === "AbortError" ? "Not installed. You can try again." : "The browser could not install PawID. Use the steps below.";
  } finally {
    installBtn.removeAttribute("aria-disabled");
  }
});

const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
if (standalone) status.textContent = "You are using the installed PawID app.";

/* ---------- Steps per device ---------- */

const key = (text: string, icon?: IconName) => el("span", { class: "key" }, icon ? svg(icon) : "", text);
const ua = navigator.userAgent;
const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);

function os(id: string, icon: IconName, title: string, sub: string, open: boolean, steps: (Node | string)[][], note?: string): HTMLElement {
  return el("details", { class: "os", id, open },
    el("summary", {}, el("span", { class: `os-ic os-ic-${id}` }, svg(icon)), el("span", {}, title, el("br"), el("small", {}, sub))),
    el("ol", {}, ...steps.map((s) => el("li", {}, el("span", {}, ...s)))),
    note ? el("p", { class: "pw-notice" }, note) : "",
  );
}

const devices = el("div", { class: "i-sec pw-card", id: "steps" },
  el("h2", {}, "Add it to your home screen"),
  el("p", {}, "PawID is a web app: no app store, no account, free. Pick your phone."),
  os("iphone", "appleFill", "iPhone and iPad", "Safari, Chrome or Edge", isIos, [
    ["Open ", el("b", {}, "pawid.pages.dev"), " in Safari."],
    ["Tap ", key("Share", "shareIos"), ". In newer iOS versions it is in the ", key("•••"), " menu at the bottom."],
    ["Scroll down and tap ", key("Add to Home Screen", "addSquare"), "."],
    ["Keep ", el("b", {}, "Open as Web App"), " on if you see it, then tap ", key("Add"), "."],
  ], "On iPhone the installed app keeps its own data, apart from Safari. Install PawID first, then add your pet in the app."),
  os("android", "androidFill", "Android", "Chrome, Samsung Internet, Edge", isAndroid, [
    ["Open ", el("b", {}, "pawid.pages.dev"), " in Chrome."],
    ["Tap the menu ", key("", "moreV"), " at the top right."],
    ["Tap ", key("Add to home screen", "addSquare"), " or ", key("Install app", "download"), "."],
    ["Tap ", key("Install"), ". PawID appears with your other apps."],
  ], "In Samsung Internet: menu, then Add page to, then Home screen."),
  os("computer", "laptop", "Computer", "Chrome, Edge or Safari on a Mac", !isIos && !isAndroid, [
    ["Chrome or Edge: click the install icon ", key("", "download"), " at the right of the address bar."],
    ["Safari on a Mac: ", key("File"), " then ", key("Add to Dock"), "."],
    ["Firefox: use PawID as a normal website, it works the same."],
  ]),
);

/* ---------- Guide ---------- */

const guide = el("section", { class: "i-sec pw-card", id: "guide" },
  el("h2", {}, "How to use PawID"),
  el("ol", { class: "guide" },
    el("li", {}, el("span", { class: "g-ic" }, svg("add")), el("div", {}, el("b", {}, "1. Add your pet"), el("span", {}, "Open the EU pet passport and copy the microchip number, the rabies vaccine dates and your vet. It takes two minutes."))),
  ),
  phoneRow(true),
  el("ol", { class: "guide", start: 5 },
    el("li", {}, el("span", { class: "g-ic" }, svg("scan")), el("div", {}, el("b", {}, "5. Show it at the door"), el("span", {}, "Staff scan the code with any phone camera and see the card. No app or account for them. A 7 day link you can send before you arrive."))),
    el("li", {}, el("span", { class: "g-ic" }, svg("calendar")), el("div", {}, el("b", {}, "6. Keep it up to date"), el("span", {}, "After each vet visit, update the dates. PawID shows if the rabies vaccine is still valid on the day."))),
  ),
);

const notes = el("section", { class: "i-sec pw-card" },
  el("h2", {}, "Good to know"),
  el("ul", { class: "i-notes" },
    el("li", {}, "Your pet's details stay on this phone. Deleting the app or the browser data deletes them too."),
    el("li", {}, "PawID is not an official document. The EU pet passport, issued by an authorised vet, is. Always carry it when you travel."),
    el("li", {}, "The code shows what the owner entered. It proves the details were not changed after the code was made, not that a vet checked them."),
  ),
);

const hero = el("section", { class: "i-hero" },
  el("h1", {}, "Install PawID ", el("em", {}, "on your phone.")),
  el("p", {}, "It opens like an app, from your home screen. Your pet's details stay on the phone, ready to show at a hotel, a restaurant or a museum."),
  el("div", { class: "row" }, installBtn, el("a", { class: "pw-btn pw-btn-secondary", href: "#steps" }, "Show me the steps"), el("a", { class: "pw-btn pw-btn-ghost i-ghost", href: "/" }, "Open PawID")),
  status,
);

const main = el("main", { id: "main" }, hero, devices, guide, notes);
const footer = siteFooter();
document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, footer);

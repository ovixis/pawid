import { COMPONENTS, PAGE, TOKENS } from "@pawid/ui";

const APP = /* css */ `
@font-face { font-family: "Switzer"; src: url("/fonts/Switzer-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
.top { position: sticky; top: 0; z-index: 10; background: color-mix(in oklab, var(--pw-canvas) 92%, transparent); border-bottom: 1px solid var(--pw-line); }
.top-in { max-width: 48rem; margin: 0 auto; padding: .625rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.logo { display: flex; align-items: center; gap: .5rem; font-weight: 800; font-size: var(--pw-text-lg); letter-spacing: -.02em; color: var(--pw-ink); text-decoration: none; }
.logo-mark { display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: .6rem; background: var(--pw-navy-800); color: var(--pw-gold-400); }
.by { font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); text-decoration: none; }
.by:hover { color: var(--pw-ink); }
main { max-width: 48rem; margin: 0 auto; padding: 1.25rem 1rem 4rem; display: grid; gap: 1rem; }
main > * { min-width: 0; }

.hero { background: var(--pw-navy-800); color: #fff; border-radius: var(--pw-radius-card); padding: 1.5rem; display: grid; gap: .75rem; }
.hero h1 { margin: 0; font-size: clamp(1.625rem, 1.35rem + 1vw, 2.125rem); line-height: 1.12; font-weight: 800; letter-spacing: -.03em; }
.hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.hero p { margin: 0; color: rgb(255 255 255 / .82); }
.hero .pw-btn { justify-self: start; }

.pets { display: grid; gap: .75rem; }
.pet { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .25rem 1rem; align-items: center; padding: 1rem; }
.pet img { width: 3.5rem; height: 3.5rem; grid-row: span 2; }
.pet h2 { margin: 0; font-size: var(--pw-text-lg); font-weight: 800; letter-spacing: -.015em; overflow-wrap: anywhere; }
.pet h2 a { color: inherit; text-decoration: none; }
.pet h2 a:hover { text-decoration: underline; text-underline-offset: 3px; }
.pet-sub { margin: 0; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.pet-actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }
@media (min-width: 40rem) { .pet { grid-template-columns: auto minmax(0, 1fr) auto; } .pet-actions { grid-column: 3; grid-row: 1 / span 2; margin: 0; } }

.empty { text-align: center; padding: 2rem 1.25rem; display: grid; justify-items: center; gap: .5rem; }
.empty img { width: 4.5rem; height: 4.5rem; }
.empty h2 { margin: .25rem 0 0; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.empty p { margin: 0 0 .5rem; color: var(--pw-ink-muted); max-width: 26rem; }

.bar { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.bar .grow { flex: 1; }
.back { display: inline-flex; align-items: center; gap: .375rem; color: var(--pw-ink-muted); font-weight: 600; text-decoration: none; min-height: 2.75rem; }
.back:hover { color: var(--pw-ink); }
.page-title { margin: 0; font-size: clamp(1.625rem, 1.35rem + 1vw, 2.125rem); font-weight: 800; letter-spacing: -.03em; line-height: 1.12; }

form.pet-form { display: grid; gap: 1rem; }
.fields { display: grid; gap: 1rem; }
@media (min-width: 40rem) { .fields-2 { grid-template-columns: 1fr 1fr; } }
.seg { display: inline-grid; grid-auto-flow: column; gap: .25rem; padding: .25rem; border-radius: var(--pw-radius-control); background: var(--pw-surface-muted); }
.seg label { display: flex; align-items: center; gap: .5rem; min-height: 2.5rem; padding: 0 1rem; border-radius: .6rem; font-weight: 700; cursor: pointer; color: var(--pw-ink-muted); }
.seg label img { width: 1.5rem; height: 1.5rem; }
.seg input { position: absolute; opacity: 0; pointer-events: none; }
.seg label:has(input:checked) { background: var(--pw-surface); color: var(--pw-ink); box-shadow: var(--pw-shadow-raised); }
.seg label:has(input:focus-visible) { outline: 2px solid var(--pw-focus); outline-offset: 2px; }
.check { display: flex; gap: .75rem; align-items: flex-start; padding: .75rem 0; border-top: 1px solid var(--pw-line); cursor: pointer; }
.check:first-child { border-top: 0; }
.check input { width: 1.25rem; height: 1.25rem; margin: .2rem 0 0; accent-color: var(--pw-navy-800); flex: none; }
.check b { display: block; }
.check span span { display: block; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
details.more summary { cursor: pointer; font-weight: 800; font-size: var(--pw-text-lg); list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
details.more summary::-webkit-details-marker { display: none; }
details.more summary::after { content: "+"; font-weight: 600; color: var(--pw-ink-muted); }
details.more[open] summary::after { content: "\\2212"; }
details.more[open] summary { margin-bottom: 1rem; }
.sticky-save { position: sticky; bottom: 0; padding: .75rem 0 calc(.75rem + env(safe-area-inset-bottom)); background: linear-gradient(to top, var(--pw-canvas) 70%, transparent); display: flex; gap: .5rem; flex-wrap: wrap; }

.stack { display: grid; gap: 1rem; }
.mt { margin-top: .75rem; }
.pw-hint.lead { margin: 0 0 1rem; }
.pw-hint.flush { margin: 0; }
.grow { flex: 1; }
.page-title.small { font-size: var(--pw-text-2xl); }
.qr-wrap { display: grid; gap: 1rem; justify-items: center; text-align: center; }
.qr-wrap canvas { width: min(18rem, 100%) !important; height: auto !important; border-radius: .75rem; box-shadow: 0 0 0 1px var(--pw-line); background: #fff; padding: .5rem; }
.qr-wrap .bar { justify-content: center; }
.foot { text-align: center; font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); padding: 1rem; }
.foot a { color: inherit; }
@media print { .top, .no-print, .foot { display: none !important; } main { padding: 0; } body { background: #fff; } }
`;

export function injectStyles(): void {
  const s = document.createElement("style");
  s.textContent = TOKENS + COMPONENTS + PAGE + APP;
  document.head.append(s);
}

import { COMPONENTS, PAGE, TOKENS } from "@pawid/ui";

const APP = /* css */ `
@font-face { font-family: "Switzer"; src: url("/fonts/Switzer-Variable.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
.top { position: sticky; top: 0; z-index: 10; min-width: 0; background: color-mix(in oklab, var(--pw-canvas) 94%, transparent); border-bottom: 1px solid var(--pw-line); }
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) { .top { background: color-mix(in oklab, var(--pw-canvas) 70%, transparent); -webkit-backdrop-filter: saturate(1.8) blur(16px); backdrop-filter: saturate(1.8) blur(16px); } }
.top-in { max-width: 72rem; margin: 0 auto; padding: .625rem 1rem; display: flex; align-items: center; gap: 1rem; overflow: hidden; /* also keeps the row from widening the page while measured */ }
.top-in > * { flex-shrink: 0; white-space: nowrap; }
.top-in > .by { margin-left: auto; }
.site-nav { order: 3; }
.nav-btn { display: inline-flex; align-items: center; gap: .375rem; min-height: 2.5rem; padding: 0 .875rem; border: 0; border-radius: 9999px; background: var(--pw-surface); color: var(--pw-ink); font: inherit; font-weight: 700; box-shadow: var(--pw-shadow-raised); cursor: pointer; anchor-name: --pw-menu; }
.nav-btn:focus-visible, .nav-list a:focus-visible { outline: 3px solid var(--pw-gold-500); outline-offset: 2px; }
.nav-btn .pw-icon { width: 1.25rem; height: 1.25rem; }
/* Collapsed: the list is a popover under the button (fixed offset where anchor positioning is missing). */
.nav-list { list-style: none; margin: 0; padding: .5rem; border: 0; border-radius: var(--pw-radius-card); background: var(--pw-surface); color: var(--pw-ink); box-shadow: var(--pw-shadow-overlay);
  position: fixed; inset: auto; inset-block-start: 4rem; inset-block-start: anchor(--pw-menu bottom); inset-inline-end: 1rem;
  inline-size: min(80dvw, 18rem); max-block-size: calc(100dvh - 6rem); overflow: auto; margin-block-start: .5rem; }
.nav-list:not([popover]):not([hidden]) { display: grid; z-index: 20; }
.nav-list[popover]:is(:popover-open) { display: grid; }
.nav-list a { display: flex; align-items: center; min-height: 2.75rem; padding: 0 .875rem; border-radius: var(--pw-radius-control); color: var(--pw-ink); text-decoration: none; font-weight: 600; }
.nav-list a:hover { background: var(--pw-surface-muted); }
.nav-list a[aria-current="page"] { font-weight: 800; box-shadow: inset 3px 0 0 var(--pw-gold-500); background: var(--pw-gold-50); }
/* Wide: the same list inline in the header. */
.top.is-wide .top-in { display: grid; grid-template-columns: 1fr auto 1fr; }
.top.is-wide .logo { justify-self: start; }
.top.is-wide .site-nav { order: 0; justify-self: center; }
.top.is-wide .by { justify-self: end; margin-left: 0; }
.top.is-wide .nav-btn { display: none; }
.top.is-wide .nav-list { position: static; display: flex; gap: .125rem; padding: 0; margin: 0; inline-size: auto; max-block-size: none; overflow: visible; background: transparent; box-shadow: none; }
.top.is-wide .nav-list a { min-height: 2.25rem; padding: 0 .75rem; border-radius: 9999px; font-size: var(--pw-text-xs); }
.top.is-wide .nav-list a[aria-current="page"] { box-shadow: inset 0 -2px 0 var(--pw-gold-500); background: var(--pw-gold-50); border-radius: .625rem .625rem .25rem .25rem; }
.top.is-measuring * { transition: none !important; }
.codes { list-style: none; margin: 0 0 .75rem; padding: 0; display: grid; gap: 0; }
.codes li { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .625rem 0; border-top: 1px solid var(--pw-line); }
.codes li:first-child { border-top: 0; }
.codes [role="status"] { color: var(--pw-no); }
.qr-stopped { opacity: .2; filter: grayscale(1); }
/* Small phones: logo, HosPet mark and Menu button only (the footer names HosPet.eu too). */
@media (max-width: 26rem) { .top:not(.is-wide) .by-txt, .top:not(.is-wide) .by b { display: none; } }
@media (forced-colors: active) { .nav-list a[aria-current="page"] { outline: 2px solid CanvasText; } }
.logo { display: flex; align-items: center; gap: .5rem; font-weight: 800; font-size: var(--pw-text-lg); letter-spacing: -.02em; color: var(--pw-ink); text-decoration: none; }
.mark-wrap { display: contents; }
.logo-mark { width: 2.25rem; height: 2.25rem; }
.logo-id { color: var(--pw-navy-700); }
.by { display: inline-flex; align-items: center; gap: .375rem; font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); text-decoration: none; }
.by b { color: var(--pw-ink); font-weight: 700; }
.by-mark { width: 1.5rem; height: 1.5rem; }
.by:hover { color: var(--pw-ink); }
main { max-width: 48rem; margin: 0 auto; padding: 1.25rem 1rem 4rem; display: grid; gap: 1rem; }
main > * { min-width: 0; }

.hero { color: #fff; padding: 1.75rem 1.5rem; display: grid; gap: .875rem; }
.hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.8vw, 2.625rem); line-height: 1.06; font-weight: 800; letter-spacing: -.035em; text-wrap: balance; }

/* The hero on every PawID page: deep navy, two soft glows, a faint dot grid and a light edge. */
.hero, .v-hero, .i-hero, .vh, .s-hero, .a-hero, .m-hero, .r-hero {
  position: relative; isolation: isolate; overflow: hidden; border-radius: var(--pw-radius-hero); padding: 1.75rem 1.5rem;
  background:
    radial-gradient(55% 70% at 100% 0%, rgb(255 198 41 / .17), transparent 65%),
    radial-gradient(60% 80% at 0% 100%, rgb(86 128 214 / .32), transparent 62%),
    var(--pw-grad-navy);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / .07), inset 0 1px 0 rgb(255 255 255 / .12), 0 24px 48px -24px rgb(14 26 49 / .55);
}
.hero::before, .v-hero::before, .i-hero::before, .vh::before, .s-hero::before, .a-hero::before, .m-hero::before, .r-hero::before {
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background-image: radial-gradient(rgb(255 255 255 / .09) 1px, transparent 1.2px); background-size: 18px 18px;
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent 85%); mask-image: linear-gradient(to bottom, #000, transparent 85%);
}
@media (min-width: 40rem) { .hero, .v-hero, .i-hero, .vh, .s-hero, .a-hero, .m-hero, .r-hero { padding: 2.5rem 2.25rem; } }

/* Sections ease in as they scroll into view (marketing pages only; off with reduced motion). */
@media (prefers-reduced-motion: no-preference) {
  html.js-reveal .reveal { opacity: 0; translate: 0 18px; transition: opacity .7s var(--pw-ease-out), translate .7s var(--pw-ease-out); }
  html.js-reveal .reveal.in { opacity: 1; translate: 0 0; }
}

/* Cards lift a little on hover where they are links or hold actions. */
.pet { transition: box-shadow 200ms var(--pw-ease-out), translate 200ms var(--pw-ease-out); }
@media (hover: hover) { .pet:hover { box-shadow: var(--pw-shadow-lifted); translate: 0 -2px; } }
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
.pp-where { margin-top: .75rem; border-radius: var(--pw-radius-control); background: var(--pw-canvas); box-shadow: inset 0 0 0 1px var(--pw-line); padding: 0 .875rem; }
.pp-where summary { display: flex; align-items: center; gap: .5rem; min-height: 2.75rem; cursor: pointer; font-weight: 700; color: var(--pw-navy-700); }
.pp-where summary .pw-icon { color: var(--pw-gold-400); }
.pp-where[open] { padding-bottom: .875rem; }
.pp-where .pw-hint { margin: 0 0 .625rem; }
.pp-drawing svg { display: block; width: 100%; max-width: 26rem; height: auto; margin-bottom: .5rem; }
.sticker-box { display: grid; gap: .5rem; margin-top: .75rem; }
.sticker-thumb { width: 100%; max-width: 16rem; max-height: 12rem; object-fit: contain; border-radius: var(--pw-radius-control); background: var(--pw-canvas); box-shadow: inset 0 0 0 1px var(--pw-line); }
.sticker-thumb[hidden] { display: none; }
.sticker-fig { margin: 0; display: grid; gap: .75rem; }
.sticker-fig figcaption { display: grid; }
.sticker-fig figcaption span { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.sticker-fig img { width: 100%; max-width: 28rem; border-radius: var(--pw-radius-control); box-shadow: inset 0 0 0 1px var(--pw-line); }
.fields-3 { display: grid; gap: .75rem; }
@media (min-width: 40rem) { .fields-3 { grid-template-columns: 1fr 1.4fr 1fr; } }
.trip-form .pw-hint { margin-top: .75rem; }
.trip-sum { margin: 0; display: flex; gap: .625rem; align-items: flex-start; padding: .875rem 1rem; border-radius: var(--pw-radius-card); font-weight: 700; }
.trip-sum .pw-icon { flex: none; width: 1.5rem; height: 1.5rem; }
.trip-sum-ok { background: color-mix(in oklab, var(--pw-ok) 12%, var(--pw-surface)); }
.trip-sum-ok .pw-icon { color: var(--pw-ok); }
.trip-sum-no { background: color-mix(in oklab, #d14343 12%, var(--pw-surface)); }
.trip-sum-no .pw-icon { color: #b42318; }
.trip-list { list-style: none; margin: 0; display: grid; gap: 0; }
.trip-item { display: grid; grid-template-columns: 5.5rem minmax(0, 1fr); gap: .75rem; padding: .75rem 0; border-top: 1px solid var(--pw-line); align-items: start; }
.trip-item:first-child { border-top: 0; padding-top: 0; }
.trip-item b { display: block; }
.trip-item p { margin: .125rem 0 0; color: var(--pw-ink-muted); }
.trip-item .pw-status { justify-self: start; }
.trip-rule { background: none; border: 0; padding: 0; margin-top: .25rem; font: inherit; font-size: var(--pw-text-xs); cursor: pointer; }
.rules-all summary { display: flex; align-items: center; justify-content: space-between; gap: .5rem; min-height: 2.75rem; cursor: pointer; font-weight: 700; color: var(--pw-navy-700); list-style: none; }
.rules-all summary::-webkit-details-marker { display: none; }
.rules-all summary small { font-weight: 500; color: var(--pw-ink-muted); margin-right: auto; }
.rules-all summary::after { content: "+"; color: var(--pw-ink-muted); }
.rules-all[open] summary::after { content: "\\2212"; }
.rules-all { margin-bottom: .75rem; }
.rule-list { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; gap: 0; }
.rule { padding: .875rem 0; border-top: 1px solid var(--pw-line); scroll-margin-top: 5rem; }
.rule:first-child { border-top: 0; }
.rule p { margin: 0; }
.rule-meta { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; margin-bottom: .375rem !important; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.rule-src { margin-top: .375rem !important; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); overflow-wrap: anywhere; }
.rule-needs_review > p:nth-child(2) { color: var(--pw-ink-muted); }
.vet-ok { margin: 0; display: flex; gap: .625rem; align-items: flex-start; padding: .75rem .875rem; border-radius: var(--pw-radius-control); background: color-mix(in oklab, var(--pw-ok) 12%, var(--pw-surface)); }
.vet-ok .pw-icon { flex: none; width: 1.375rem; height: 1.375rem; color: var(--pw-ok); }
.vet-card .bar { margin-top: .75rem; }
.vet-wait { display: flex; align-items: center; justify-content: center; gap: .5rem; margin: 0; font-weight: 700; }
.vet-dot { width: .625rem; height: .625rem; border-radius: 50%; background: var(--pw-gold-400); animation: vet-pulse 1.2s ease-in-out infinite; }
@keyframes vet-pulse { 50% { opacity: .25; } }
@media (prefers-reduced-motion: reduce) { .vet-dot { animation: none; } }
.pair-box { display: grid; justify-items: center; text-align: center; gap: .625rem; }
.pair-box canvas { width: 11rem !important; height: 11rem !important; }
.pair-code { margin: 0; font: 800 2.75rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; color: var(--pw-navy-800); }
.pair-number { margin: 0; font: 800 4.5rem/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; color: var(--pw-navy-800); }
.pair-vet { margin: 0; display: flex; gap: .5rem; align-items: flex-start; text-align: left; font-weight: 700; }
.pair-vet .pw-icon { flex: none; color: var(--pw-ok); width: 1.375rem; height: 1.375rem; }
.pair-actions { justify-content: center; }
.restore-cta { margin: 0; text-align: center; color: var(--pw-ink-muted); }
.restore-list { list-style: none; margin: 0 0 1rem; padding: 0; display: grid; gap: .5rem; }
.restore-list li { display: grid; grid-template-columns: 2rem auto minmax(0, 1fr); gap: .625rem; align-items: center; }
.restore-list span { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); overflow-wrap: anywhere; }
.backup .bar, .reminder .bar { margin-top: .75rem; }
.reminder .pw-hint.flush { margin-top: .75rem; }
#app { min-height: 100svh; display: grid; grid-template-rows: auto 1fr auto; }
#app > main { width: 100%; box-sizing: border-box; align-content: start; }
.site-foot { background: var(--pw-navy-800); color: rgb(255 255 255 / .78); font-size: var(--pw-text-xs); border-top: 3px solid var(--pw-gold-400); }
.f-in { max-width: 64rem; margin: 0 auto; padding: 2rem 1rem 1.25rem; display: grid; gap: 1.5rem; }
.f-brand { display: grid; gap: .625rem; justify-items: start; max-width: 22rem; }
.f-brand p { margin: 0; line-height: 1.55; }
.f-logo { display: inline-flex; align-items: center; gap: .5rem; color: #fff; font-weight: 800; font-size: var(--pw-text-lg); letter-spacing: -.02em; text-decoration: none; }
.f-mark { width: 2.25rem; height: 2.25rem; box-shadow: 0 0 0 1px rgb(255 255 255 / .14); border-radius: .55rem; }
.f-by { display: inline-flex; align-items: center; gap: .375rem; min-height: 2rem; padding: 0 .75rem 0 .5rem; border-radius: 9999px; background: rgb(255 255 255 / .08); color: rgb(255 255 255 / .8); text-decoration: none; }
.f-by b { color: #fff; }
.f-by:hover { background: rgb(255 255 255 / .14); }
.f-hmark { width: 1.25rem; height: 1.25rem; }
.f-cols { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem .75rem; }
.f-col h2 { margin: 0 0 .5rem; color: var(--pw-gold-400); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.f-col ul { list-style: none; margin: 0; padding: 0; display: grid; gap: .125rem; }
.f-col a { display: inline-flex; align-items: center; min-height: 2rem; color: #fff; text-decoration: none; font-weight: 500; }
.f-col a:hover { color: var(--pw-gold-400); text-decoration: underline; text-underline-offset: 3px; }
.site-foot a:focus-visible { outline: 2px solid var(--pw-gold-400); outline-offset: 2px; border-radius: .25rem; }
.f-notice { margin: 0; display: flex; gap: .625rem; align-items: flex-start; padding: .75rem 1rem; border-radius: var(--pw-radius-control); background: rgb(255 255 255 / .06); box-shadow: inset 0 0 0 1px rgb(255 255 255 / .1); line-height: 1.5; }
.f-notice b { color: #fff; }
.f-notice .pw-icon { flex: none; color: var(--pw-gold-400); margin-top: .1rem; }
.f-base { display: flex; flex-wrap: wrap; gap: .25rem 1rem; padding-top: 1rem; border-top: 1px solid rgb(255 255 255 / .1); color: rgb(255 255 255 / .6); }
@media (min-width: 46rem) {
  .f-in { grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); gap: 2rem 3rem; padding-top: 2.5rem; }
  .f-cols { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .f-notice, .f-base { grid-column: 1 / -1; }
}
@media print { .top, .no-print, .site-foot { display: none !important; } main { padding: 0; } body { background: #fff; } }
`;

export function injectStyles(): void {
  const s = document.createElement("style");
  s.textContent = TOKENS + COMPONENTS + PAGE + APP;
  document.head.append(s);
}

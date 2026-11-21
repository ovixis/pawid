/**
 * PawID design tokens and base components.
 *
 * Taken from the HosPet.eu design system (frontend/src/app/globals.css, 2026-11-21):
 * cool fog canvas, ink text, one gold highlight, navy for anything that must be read.
 * Plain CSS strings so the same source serves the PWA, the verify page (inline, strict CSP)
 * and the venue components (Shadow DOM).
 *
 * Every custom property starts with --pw- so a venue's own CSS variables never clash.
 * A venue may change only --pw-accent (and --pw-accent-ink if its colour is dark).
 */

export const TOKENS = /* css */ `
:root, :host {
  --pw-canvas: #f4f6f8;
  --pw-surface: #ffffff;
  --pw-surface-muted: #eceff3;
  --pw-ink: #16181d;
  --pw-ink-muted: #4b5563;
  --pw-ink-subtle: #5f6673;
  --pw-line: color-mix(in oklab, #16181d 10%, transparent);
  --pw-line-strong: color-mix(in oklab, #16181d 18%, transparent);

  --pw-gold-50: #fffaeb;
  --pw-gold-100: #fff1c7;
  --pw-gold-200: #ffe38f;
  --pw-gold-400: #ffc629;
  --pw-gold-500: #f5b800;
  --pw-navy-50: #f3f6fb;
  --pw-navy-100: #e4eaf4;
  --pw-navy-200: #c7d3e8;
  --pw-navy-600: #2a4473;
  --pw-navy-700: #1e3359;
  --pw-navy-800: #14233f;

  --pw-accent: var(--pw-gold-500);
  --pw-accent-hover: color-mix(in oklab, var(--pw-accent) 82%, white);
  --pw-accent-ink: #16181d;
  --pw-focus: var(--pw-navy-600);
  --pw-ok: #12a36f;
  --pw-warn: #e8a200;
  --pw-no: #d92d20;
  --pw-danger: #b42318;

  /* Shape and depth (2026-11-21, "Framer" pass): rounder cards, pill buttons, layered soft shadows. */
  --pw-radius-control: 0.875rem;
  --pw-radius-card: 1.25rem;
  --pw-radius-hero: 1.5rem;
  --pw-shadow-raised: 0 0 0 1px rgb(16 24 40 / 0.07), 0 1px 2px rgb(16 24 40 / 0.04), 0 4px 14px -4px rgb(16 24 40 / 0.06);
  --pw-shadow-lifted: 0 0 0 1px rgb(16 24 40 / 0.07), 0 2px 4px rgb(16 24 40 / 0.04), 0 18px 40px -14px rgb(16 24 40 / 0.2);
  --pw-shadow-overlay: 0 0 0 1px rgb(16 24 40 / 0.08), 0 28px 64px -24px rgb(16 24 40 / 0.35);
  --pw-ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --pw-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --pw-grad-navy: linear-gradient(160deg, #22395f, #0f1b33);
  --pw-grad-gold: linear-gradient(180deg, #ffd44a, #f5b800);

  --pw-font: "Switzer", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --pw-text-xs: 0.875rem;
  --pw-text-sm: 1rem;
  --pw-text-base: 1.125rem;
  --pw-text-lg: 1.25rem;
  --pw-text-2xl: 1.5rem;
  --pw-text-3xl: 1.9375rem;
}
`;

export const COMPONENTS = /* css */ `
.pw-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  min-height: 2.75rem; padding: .625rem 1.25rem; border: 0; border-radius: var(--pw-radius-control);
  font: inherit; font-weight: 700; line-height: 1.25; white-space: nowrap; cursor: pointer; text-decoration: none;
  transition: background-color 150ms var(--pw-ease), box-shadow 150ms var(--pw-ease), transform 150ms var(--pw-ease), color 150ms;
}
.pw-btn:focus-visible, .pw-link:focus-visible { outline: 2px solid var(--pw-focus); outline-offset: 2px; }
.pw-btn:active:not(:disabled) { transform: scale(.98); }
.pw-btn:disabled, .pw-btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
.pw-btn[aria-busy="true"] { cursor: progress; }
.pw-btn-primary { background: var(--pw-accent); color: var(--pw-accent-ink); box-shadow: 0 1px 0 rgb(255 255 255 / .35) inset, 0 1px 2px rgb(22 24 29 / .12); }
.pw-btn-primary:hover:not(:disabled) { background: var(--pw-accent-hover); }
.pw-btn-secondary { background: var(--pw-surface); color: var(--pw-ink); font-weight: 600; box-shadow: var(--pw-shadow-raised); }
.pw-btn-secondary:hover:not(:disabled) { background: var(--pw-surface-muted); }
.pw-btn-ghost { background: transparent; color: var(--pw-ink-muted); font-weight: 600; }
.pw-btn-ghost:hover:not(:disabled) { background: var(--pw-surface-muted); color: var(--pw-ink); }
.pw-btn-dark { background: var(--pw-navy-800); color: #fff; }
.pw-btn-dark:hover:not(:disabled) { background: var(--pw-navy-700); }
.pw-btn-sm { min-height: 2.25rem; padding: .375rem .875rem; font-size: var(--pw-text-xs); }
.pw-btn-icon { min-height: 2.75rem; min-width: 2.75rem; padding: 0; }

.pw-card { background: var(--pw-surface); border-radius: var(--pw-radius-card); box-shadow: var(--pw-shadow-raised); }
.pw-card-pad { padding: 1.25rem; }
@media (min-width: 40rem) { .pw-card-pad { padding: 1.5rem; } }
.pw-card-head { display: flex; align-items: center; justify-content: space-between; gap: .75rem; margin: 0 0 .75rem; }
.pw-card-head h2, .pw-card-head h3 { margin: 0; font-size: var(--pw-text-lg); font-weight: 800; letter-spacing: -.015em; color: var(--pw-ink); }

.pw-label { display: block; font-size: var(--pw-text-xs); font-weight: 700; color: var(--pw-ink-muted); }
.pw-hint { margin: .25rem 0 0; font-size: var(--pw-text-xs); color: var(--pw-ink-subtle); }
.pw-input {
  display: block; width: 100%; min-height: 2.75rem; margin-top: .375rem; padding: .625rem .875rem;
  border-radius: var(--pw-radius-control); border: 1px solid var(--pw-line-strong);
  background: var(--pw-surface); color: var(--pw-ink); font: inherit; font-size: var(--pw-text-sm);
  transition: border-color 150ms, box-shadow 150ms;
}
.pw-input::placeholder { color: var(--pw-ink-subtle); }
.pw-input:hover:not(:disabled):not(:focus) { border-color: color-mix(in oklab, var(--pw-ink) 30%, transparent); }
.pw-input:focus { outline: none; border-color: var(--pw-focus); box-shadow: 0 0 0 3px color-mix(in oklab, var(--pw-accent) 35%, transparent); }
.pw-input[aria-invalid="true"] { border-color: var(--pw-danger); box-shadow: 0 0 0 3px color-mix(in oklab, var(--pw-danger) 15%, transparent); }
textarea.pw-input { min-height: 6rem; resize: vertical; }

.pw-status {
  display: inline-flex; align-items: center; gap: .45rem; white-space: nowrap;
  height: 1.75rem; padding: 0 .7rem; border-radius: 9999px;
  background: var(--pw-surface); color: var(--pw-ink);
  box-shadow: 0 0 0 1px var(--pw-line-strong), 0 1px 2px rgb(22 24 29 / .06);
  font-size: .8125rem; line-height: 1; font-weight: 700; --pw-dot: var(--pw-gold-500);
}
.pw-status::before { content: ""; width: .45rem; height: .45rem; border-radius: 9999px; flex: none; background: var(--pw-dot); box-shadow: 0 0 0 3px color-mix(in srgb, var(--pw-dot) 24%, transparent); }
.pw-status-ok { --pw-dot: var(--pw-ok); }
.pw-status-warn { --pw-dot: var(--pw-warn); }
.pw-status-no { --pw-dot: var(--pw-no); }
.pw-status-navy { --pw-dot: var(--pw-navy-800); }

.pw-ring { display: grid; place-items: center; flex: none; width: 2.75rem; height: 2.75rem; border-radius: 9999px; background: var(--pw-gold-100); color: var(--pw-navy-800); box-shadow: 0 0 0 5px var(--pw-gold-50), 0 0 0 6px var(--pw-gold-200); }
.pw-ring-navy { background: var(--pw-navy-100); box-shadow: 0 0 0 5px var(--pw-navy-50), 0 0 0 6px var(--pw-navy-200); }

.pw-icon { width: 1.25em; height: 1.25em; flex: none; vertical-align: -.25em; }
.pw-spin { animation: pw-spin 1s linear infinite; }
@keyframes pw-spin { to { transform: rotate(360deg); } }

.pw-notice { margin: 0; padding: .75rem 1rem; border-radius: var(--pw-radius-control); background: var(--pw-gold-50); box-shadow: 0 0 0 1px var(--pw-gold-200); color: var(--pw-ink); font-size: var(--pw-text-xs); }
fieldset.pw-card { border: 0; margin: 0; min-width: 0; }
fieldset.pw-card > legend { float: left; width: 100%; padding: 0; }
fieldset.pw-card > legend + * { clear: both; }
.pw-error { margin: 0; color: var(--pw-danger); font-size: var(--pw-text-xs); font-weight: 600; }
.pw-link { color: var(--pw-navy-700); font-weight: 600; text-underline-offset: 2px; }
.pw-mono { font-variant-numeric: tabular-nums; letter-spacing: .02em; }
.pw-mark { width: 1.5rem; height: 1.5rem; flex: none; display: inline-block; vertical-align: middle; }
.pw-by { display: inline-flex; align-items: center; gap: .375rem; flex-wrap: wrap; }
.pw-by .pw-mark { width: 1.125rem; height: 1.125rem; }
.pw-by a { display: inline-flex; align-items: center; gap: .375rem; color: inherit; }
.pw-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* The pet card: the same layout as the HosPet.eu pet card, shown by the app and the verify page. */
.pw-pc { overflow: hidden; container-type: inline-size; }
.pw-pc-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.5rem; background: var(--pw-navy-800); color: #fff; }
.pw-pc-head p { margin: 0; }
.pw-pc-brand { display: flex; align-items: center; gap: .5rem; font-weight: 800; }
.pw-pc-brand .pw-mark { width: 1.75rem; height: 1.75rem; }
.pw-pc-vet { display: flex; gap: .625rem; align-items: flex-start; margin: 0 1.5rem 1rem; padding: .75rem .875rem; border-radius: var(--pw-radius-control); line-height: 1.45; }
.pw-pc-vet .pw-icon { flex: none; width: 1.375rem; height: 1.375rem; margin-top: .05rem; }
.pw-pc-vet-ok { background: color-mix(in oklab, var(--pw-ok) 12%, #fff); }
.pw-pc-vet-ok .pw-icon { color: var(--pw-ok); }
.pw-pc-vet-no { background: color-mix(in oklab, #f5b800 18%, #fff); }
.pw-pc-vet-no .pw-icon { color: #9a6700; }
.pw-pc-meta { font-size: var(--pw-text-xs); color: rgb(255 255 255 / .8); }
.pw-pc-hero { display: flex; align-items: center; gap: 1rem; padding: 1.5rem 1.5rem 1rem; }
.pw-pc-hero img { width: 4rem; height: 4rem; flex: none; }
.pw-pc-hero h1, .pw-pc-hero h2 { margin: 0; font-size: var(--pw-text-3xl); font-weight: 800; letter-spacing: -.025em; line-height: 1.15; color: var(--pw-ink); overflow-wrap: anywhere; }
.pw-pc-hero p { margin: .125rem 0 0; font-size: var(--pw-text-lg); color: var(--pw-ink-muted); }
.pw-pc-grid { display: grid; gap: 1.5rem 2rem; padding: 0 1.5rem 1.5rem; }
@container (min-width: 36rem) { .pw-pc-row { grid-template-columns: minmax(0, 9rem) minmax(0, 1fr); } .pw-pc-grid { grid-template-columns: 1fr 1fr; padding: 0 2rem 2rem; } .pw-pc-hero { padding: 2rem 2rem 1rem; } }
.pw-pc-grid h3 { margin: 0 0 .25rem; font-size: var(--pw-text-sm); font-weight: 800; color: var(--pw-ink-subtle); }
.pw-pc-grid dl { margin: 0; }
.pw-pc-row { display: grid; grid-template-columns: minmax(0, 7.5rem) minmax(0, 1fr); gap: .75rem; padding: .625rem 0; border-top: 1px solid var(--pw-line); }
.pw-pc-row:first-child { border-top: 0; }
.pw-pc-row dt { color: var(--pw-ink-muted); }
.pw-pc-row dd { margin: 0; font-weight: 600; color: var(--pw-ink); overflow-wrap: anywhere; }
.pw-pc-row dd.pw-empty { font-weight: 400; color: var(--pw-ink-subtle); }
.pw-pc-wide { grid-column: 1 / -1; }
.pw-pc-notes { margin: 0; white-space: pre-line; color: var(--pw-ink); overflow-wrap: anywhere; }
.pw-pc-foot { padding: .75rem 1.5rem; border-top: 1px solid var(--pw-line); background: var(--pw-canvas); font-size: var(--pw-text-xs); color: var(--pw-ink-muted); }
@container (min-width: 36rem) { .pw-pc-foot { padding: .75rem 2rem; } }

/* "Framer" pass: pill buttons with a soft top light, a small lift on hover and a press on tap. */
.pw-btn { border-radius: 9999px; transition: background-color 160ms var(--pw-ease), box-shadow 200ms var(--pw-ease-out), translate 200ms var(--pw-ease-out), scale 120ms var(--pw-ease), color 160ms; }
.pw-btn:active:not(:disabled) { transform: none; scale: .97; }
.pw-btn:focus-visible { outline: 3px solid color-mix(in oklab, var(--pw-accent) 70%, var(--pw-navy-800)); outline-offset: 3px; }
.pw-btn-primary {
  background: linear-gradient(to bottom, rgb(255 255 255 / .28), rgb(255 255 255 / 0) 60%), var(--pw-accent);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / .55), 0 1px 2px rgb(16 24 40 / .14), 0 6px 16px -6px color-mix(in oklab, var(--pw-accent) 75%, transparent);
}
.pw-btn-primary:hover:not(:disabled) { background: linear-gradient(to bottom, rgb(255 255 255 / .4), rgb(255 255 255 / .05) 60%), var(--pw-accent); translate: 0 -1px; box-shadow: inset 0 1px 0 rgb(255 255 255 / .6), 0 2px 4px rgb(16 24 40 / .12), 0 12px 24px -8px color-mix(in oklab, var(--pw-accent) 80%, transparent); }
.pw-btn-secondary { background: var(--pw-surface); box-shadow: var(--pw-shadow-raised); }
.pw-btn-secondary:hover:not(:disabled) { background: var(--pw-surface); translate: 0 -1px; box-shadow: var(--pw-shadow-lifted); }
.pw-btn-dark { background: var(--pw-grad-navy); box-shadow: inset 0 1px 0 rgb(255 255 255 / .14), 0 1px 2px rgb(16 24 40 / .2), 0 8px 18px -8px rgb(20 35 63 / .6); }
.pw-btn-dark:hover:not(:disabled) { background: var(--pw-grad-navy); translate: 0 -1px; filter: brightness(1.12); }
.pw-card { border-radius: var(--pw-radius-card); }
.pw-input { border-radius: var(--pw-radius-control); }

/* Icon tiles: an icon in a rounded tile with a soft top light, like app icons. */
.pw-tile { display: inline-grid; place-items: center; flex: none; width: 2.75rem; height: 2.75rem; border-radius: .875rem; background: var(--pw-grad-navy); color: var(--pw-gold-400); box-shadow: inset 0 1px 0 rgb(255 255 255 / .16), inset 0 -1px 0 rgb(0 0 0 / .2), 0 1px 2px rgb(16 24 40 / .18), 0 8px 18px -8px rgb(20 35 63 / .55); }
.pw-tile .pw-icon { width: 1.375rem; height: 1.375rem; }
.pw-tile-gold { background: var(--pw-grad-gold); color: var(--pw-navy-800); box-shadow: inset 0 1px 0 rgb(255 255 255 / .6), inset 0 -1px 0 rgb(0 0 0 / .08), 0 1px 2px rgb(16 24 40 / .12), 0 8px 18px -8px rgb(245 184 0 / .6); }
.pw-tile-soft { background: linear-gradient(180deg, #fff, var(--pw-gold-50)); color: var(--pw-navy-800); box-shadow: inset 0 0 0 1px var(--pw-gold-200), 0 1px 2px rgb(16 24 40 / .06); }
.pw-tile-lg { width: 3.5rem; height: 3.5rem; border-radius: 1.125rem; }
.pw-tile-lg .pw-icon { width: 1.75rem; height: 1.75rem; }

/* Eyebrow label above a title. */
.pw-eyebrow { display: inline-flex; align-items: center; gap: .5rem; margin: 0; padding: .3rem .75rem .3rem .4rem; border-radius: 9999px; font-size: .8125rem; font-weight: 700; letter-spacing: .01em; background: rgb(255 255 255 / .08); color: rgb(255 255 255 / .9); box-shadow: inset 0 0 0 1px rgb(255 255 255 / .14); justify-self: start; }
.pw-eyebrow::before { content: ""; width: .5rem; height: .5rem; margin-left: .2rem; border-radius: 9999px; background: var(--pw-gold-400); box-shadow: 0 0 0 3px rgb(255 198 41 / .25); }

@media (prefers-reduced-motion: reduce) {
  .pw-btn, .pw-input { transition: none; }
  .pw-btn:hover:not(:disabled) { translate: none; }
  .pw-spin { animation-duration: 3s; }
}
`;

/** Base page styles for the PawID app and the verify page. Not used inside venue components. */
export const PAGE = /* css */ `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--pw-canvas); color: var(--pw-ink); font-family: var(--pw-font); font-size: var(--pw-text-sm); line-height: 1.6; -webkit-font-smoothing: antialiased; }
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }
img, svg { display: block; }
.pw-icon { display: inline-block; }
`;

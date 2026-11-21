// Cloudflare Turnstile on public forms: mostly invisible, a small check only when Cloudflare is unsure.
// The script loads only on pages with such a form. Local builds use Cloudflare's always-pass test key.
const SITEKEY: string = import.meta.env.VITE_TURNSTILE_SITEKEY ?? (location.hostname === "pawid.hospet.eu" ? "0x4AAAAAAGMQ5fFNwGuIPF6m" : "1x00000000000000000000AA");

interface TurnstileApi {
  render(el: HTMLElement, o: { sitekey: string; appearance?: string; size?: string; callback?: (t: string) => void; "expired-callback"?: () => void }): string;
  reset(id: string): void;
}
declare global { interface Window { turnstile?: TurnstileApi } }

let loading: Promise<TurnstileApi> | null = null;
function load(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile did not load")));
    s.onerror = () => reject(new Error("Turnstile did not load"));
    document.head.append(s);
  });
  return loading;
}

/** Puts the check in `box`. token() resolves once Cloudflare has a token; reset() after each send. */
export function humanCheck(box: HTMLElement): { token: () => Promise<string>; reset: () => void } {
  let current = "";
  let waiters: ((t: string) => void)[] = [];
  let id = "";
  void load().then((t) => {
    id = t.render(box, {
      sitekey: SITEKEY,
      appearance: "interaction-only",
      callback: (tok) => { current = tok; waiters.forEach((w) => w(tok)); waiters = []; },
      "expired-callback": () => { current = ""; },
    });
  }).catch(() => { box.textContent = "The check that you are a person could not load. Check the connection or turn off a blocker for this page."; });
  return {
    token: () => (current ? Promise.resolve(current) : new Promise((r) => waiters.push(r))),
    reset: () => { current = ""; if (id) window.turnstile?.reset(id); },
  };
}

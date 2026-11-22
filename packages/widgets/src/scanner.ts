import { petCardHtml, type CardData, type VetCheckView } from "@pawid/ui";
import { PawidElement, byLine, h } from "./base";

/**
 * <pawid-scanner> For reception, a waiter or a museum desk: scan the guest's PawID QR with the
 * camera (or paste the link) and see the pet card. No account, no app.
 *
 * Safety: a scanned code is never opened as a link. Only the token is taken out of a PawID
 * link and checked against the PawID API; anything else is refused.
 * The camera needs HTTPS, and inside an iframe the parent must allow it (allow="camera").
 */

/** The token inside a PawID link (…/v/<token>) or a bare token. */
export function tokenFrom(text: string): string | null {
  const t = text.trim();
  const m = t.match(/^https:\/\/[^/\s]+\/v\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\/?$/);
  if (m) return m[1]!;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t) && t.length < 4000 ? t : null;
}

type Verify =
  | { ok: true; payload: CardData & { exp: number }; vet?: VetCheckView }
  | { ok: false; reason: "malformed" | "bad_signature" | "expired" | "unsupported_version" | "revoked" };

const REASONS: Record<string, string> = {
  malformed: "This is not a valid PawID code.",
  bad_signature: "This code was changed or is not genuine.",
  expired: "This code has expired. Ask the guest to make a new one in the PawID app.",
  unsupported_version: "This code was made by a newer version of PawID.",
  revoked: "The guest stopped this code. Ask them to make a new one in the PawID app.",
};

interface Detector { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }

export class PawidScanner extends PawidElement {
  protected readonly component = "scanner";
  private stream: MediaStream | null = null;
  private timer = 0;
  private busy = false;

  protected extraCss(): string {
    return `
.cam { position: relative; overflow: hidden; border-radius: var(--pw-radius-card); background: var(--pw-navy-800); aspect-ratio: 1; max-width: 22rem; width: 100%; justify-self: center; }
.cam video { width: 100%; height: 100%; object-fit: cover; }
.cam::after { content: ""; position: absolute; inset: 18%; border: 3px solid var(--pw-gold-400); border-radius: 1rem; box-shadow: 0 0 0 100vmax rgb(13 23 43 / .45); }
form { display: grid; gap: .5rem; }
form .row .pw-input { flex: 1; min-width: 12rem; margin: 0; }
.ok { display: flex; align-items: center; gap: .5rem; font-weight: 700; }
.ok .pw-icon { color: var(--pw-ok); }
.pw-pc { box-shadow: var(--pw-shadow-raised); }
`;
  }

  disconnectedCallback(): void {
    this.stop();
  }

  protected render(): void {
    this.stop();
    const status = h("p", { class: "muted", role: "status" });
    const input = h("input", { class: "pw-input", type: "url", inputmode: "url", autocomplete: "off", placeholder: "https://…/v/…", "aria-label": "PawID link" });
    const form = h(
      "form",
      { onsubmit: (e: Event) => { e.preventDefault(); this.check(input.value, status); } },
      h("p", { class: "pw-label" }, "Or paste the link the guest sent"),
      h("div", { class: "row" }, input, h("button", { class: "pw-btn pw-btn-secondary", type: "submit" }, "Check")),
    );
    const start = h("button", { class: "pw-btn pw-btn-primary", type: "button", onclick: () => this.scan(status) }, "Scan a PawID code");
    this.show(
      h("section", { class: "pw-card box", "aria-label": "Check a guest's PawID" },
        h("h2", { class: "title" }, "Check a guest's pet"),
        h("p", { class: "muted" }, "Point the camera at the QR code on the guest's phone. The card shows what the owner chose to share."),
        h("div", { class: "row" }, start),
        status,
        form,
        byLine(),
      ),
    );
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = 0;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private async scan(status: HTMLElement): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = "This browser can't use the camera here. Paste the link instead.";
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    } catch (e) {
      const name = (e as DOMException).name;
      status.textContent = name === "NotAllowedError" || name === "SecurityError"
        ? "The camera is blocked. Allow it for this site in the browser, or paste the link below."
        : "No camera found. Paste the link below.";
      return;
    }
    const video = h("video", { playsInline: true, muted: true, autoplay: true, "aria-label": "Camera" });
    video.srcObject = this.stream;
    const stopBtn = h("button", { class: "pw-btn pw-btn-ghost", type: "button", onclick: () => this.render() }, "Stop");
    this.show(
      h("section", { class: "pw-card box", "aria-label": "Scanning" },
        h("h2", { class: "title" }, "Scanning"),
        h("div", { class: "cam" }, video),
        h("p", { class: "muted", role: "status" }, "Hold the guest's phone inside the frame."),
        h("div", { class: "row" }, stopBtn),
      ),
    );
    await video.play().catch(() => {});
    const detect = await this.detector();
    this.timer = window.setInterval(async () => {
      if (this.busy || video.readyState < 2) return;
      this.busy = true;
      try {
        const text = await detect(video);
        if (text) {
          const token = tokenFrom(text);
          if (token) {
            this.stop();
            await this.verify(token);
          }
        }
      } finally {
        this.busy = false;
      }
    }, 250);
  }

  /** BarcodeDetector where the browser has it (Chrome, Android); otherwise jsQR (Apache-2.0), loaded only then. */
  private async detector(): Promise<(v: HTMLVideoElement) => Promise<string | null>> {
    const BD = (globalThis as unknown as { BarcodeDetector?: { new (o: { formats: string[] }): Detector; getSupportedFormats(): Promise<string[]> } }).BarcodeDetector;
    if (BD && (await BD.getSupportedFormats().catch((): string[] => [])).includes("qr_code")) {
      const d = new BD({ formats: ["qr_code"] });
      return async (v) => (await d.detect(v).catch(() => []))[0]?.rawValue ?? null;
    }
    const { default: jsQR } = await import("jsqr");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    return async (v) => {
      const w = Math.min(v.videoWidth, 640);
      const scale = w / v.videoWidth;
      canvas.width = w;
      canvas.height = Math.round(v.videoHeight * scale);
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
    };
  }

  private check(text: string, status: HTMLElement): void {
    const token = tokenFrom(text);
    if (!token) {
      status.textContent = "That is not a PawID link. It looks like https://…/v/ followed by a long code.";
      return;
    }
    void this.verify(token);
  }

  private async verify(token: string): Promise<void> {
    this.show(h("div", { class: "pw-card box", "aria-busy": "true" }, h("p", { class: "muted" }, "Checking the code…")));
    let res: Verify;
    try {
      const r = await fetch(`${this.api}/v1/verify?token=${encodeURIComponent(token)}`, { credentials: "omit" });
      res = (await r.json()) as Verify;
    } catch {
      this.show(h("div", { class: "pw-card box" }, h("p", { class: "pw-error" }, "The code could not be checked. Check the connection and try again."), this.again()));
      return;
    }
    if (!res.ok) {
      this.show(h("div", { class: "pw-card box", role: "alert" }, h("h2", { class: "title" }, "Cannot verify"), h("p", {}, REASONS[res.reason] ?? REASONS.malformed!), this.again()));
      return;
    }
    const holder = h("div");
    // petCardHtml escapes every value (packages/ui/src/card.ts, covered by tests).
    holder.innerHTML = petCardHtml(res.payload, { todayIso: new Date().toISOString().slice(0, 10), hideEmpty: true, vet: res.vet });
    const mins = Math.max(1, Math.round((res.payload.exp * 1000 - Date.now()) / 60000));
    this.show(
      h("div", { class: "box flush" },
        h("p", { class: "ok", role: "status" }, "Genuine code, not changed since the owner made it.", h("span", { class: "muted" }, mins < 120 ? ` Valid ${mins} more min.` : "")),
        holder,
        this.again(),
      ),
    );
  }

  private again(): HTMLElement {
    return h("div", { class: "row" }, h("button", { class: "pw-btn pw-btn-secondary", type: "button", onclick: () => this.render() }, "Check another pet"));
  }
}

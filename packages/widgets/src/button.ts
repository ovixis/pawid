import { PawidElement, h } from "./base";

/**
 * <pawid-button venue="Hotel Bella Vista" days="7">
 * For a booking confirmation or "before you arrive" page: opens the PawID app, where
 * the guest picks the pet and makes a code for this venue. Free, no account.
 */
export class PawidButton extends PawidElement {
  protected readonly component = "button";

  static get observedAttributes() {
    return ["venue", "days", "label"];
  }
  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  protected render(): void {
    const venue = (this.getAttribute("venue") ?? "").trim().slice(0, 100);
    const days = this.getAttribute("days") === "0" ? "0" : "7";
    const label = (this.getAttribute("label") ?? "").trim().slice(0, 60) || "Show your pet's PawID";
    const q = new URLSearchParams({ days });
    if (venue) q.set("venue", venue);
    const url = `${this.app}/#/share?${q.toString()}`;
    this.show(
      h("div", { class: "row", part: "row" },
        h("a", { class: "pw-btn pw-btn-primary", part: "button", href: url, target: "_blank", rel: "noopener" }, label),
        h("span", { class: "muted" }, "Free, no account. Your pet's details stay on your phone."),
      ),
    );
  }
}

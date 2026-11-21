import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
beforeEach(() => {
  calls.length = 0;
  globalThis.fetch = vi.fn(async (u: RequestInfo | URL) => {
    calls.push(String(u));
    if (String(u).includes("/v1/rules")) {
      return new Response(JSON.stringify({
        country: "IT", countryCovered: false, lastChecked: "2026-11-21", disclaimer: "Not legal advice and not official.",
        rules: [
          { id: "a", text: "Microchip <b>needed</b>", status: "verified", sources: ["https://europa.eu/x"], lastChecked: "2026-11-21", scope: "eu" },
          { id: "b", text: "Waiting period", status: "needs_review", sources: ["javascript:alert(1)"], lastChecked: "2026-11-21", scope: "eu" },
        ],
      }), { status: 200 });
    }
    return new Response(null, { status: 204 });
  }) as typeof fetch;
});

const { readPolicy, tokenFrom } = await import("../src/index");

describe("tokenFrom (scanner)", () => {
  it("takes the token out of a PawID link", () => {
    expect(tokenFrom("https://pawid-api.hospet.workers.dev/v/aaa.bbb.ccc")).toBe("aaa.bbb.ccc");
    expect(tokenFrom("  aaa.bbb.ccc ")).toBe("aaa.bbb.ccc");
  });
  it("refuses anything else", () => {
    expect(tokenFrom("http://evil.test/v/aaa.bbb.ccc")).toBeNull();
    expect(tokenFrom("https://evil.test/login")).toBeNull();
    expect(tokenFrom("javascript:alert(1)")).toBeNull();
    expect(tokenFrom("https://x.test/v/aaa.bbb.ccc?next=https://evil")).toBeNull();
  });
});

describe("readPolicy", () => {
  it("needs a name and drops unknown values", () => {
    expect(readPolicy({ dogs: "yes" })).toBeNull();
    const p = readPolicy({ name: "Da Rosa", dogs: "maybe", maxWeightKg: 900, link: "javascript:alert(1)", where: ["terrace", 5] });
    expect(p).toEqual({ name: "Da Rosa", dogs: undefined, cats: undefined, maxWeightKg: undefined, maxPets: undefined, fee: undefined, where: ["terrace"], aloneInRoom: undefined, ask: undefined, notes: undefined, updated: undefined, link: undefined });
  });
});

describe("<pawid-policy>", () => {
  it("renders the venue's words as text, counts the load once", async () => {
    document.body.innerHTML = `<pawid-policy with-button><script type="application/json">${JSON.stringify({ name: "<img src=x onerror=alert(1)>", dogs: "yes", where: ["<b>terrace</b>"], notes: "<script>x</script>" }).replace(/</g, "\\u003c")}</script></pawid-policy><pawid-policy><script type="application/json">{"name":"B"}</script></pawid-policy>`;
    const el = document.querySelector("pawid-policy")!;
    const root = el.shadowRoot!;
    await vi.waitFor(() => expect(root.textContent).toContain("Pets at"));
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelector("b")).toBeNull();
    expect(root.textContent).toContain("Pets at <img src=x onerror=alert(1)>");
    expect(root.textContent).toContain("Welcome");
    const a = root.querySelector("a.pw-btn") as HTMLAnchorElement;
    expect(a.getAttribute("href")).toContain("venue=%3Cimg%20src%3Dx");
    expect(calls.filter((c) => c.includes("/v1/w?c=policy"))).toHaveLength(1);
  });
});

describe("<pawid-button>", () => {
  it("links to the app with the venue", () => {
    document.body.innerHTML = `<pawid-button venue="Hotel Bella & Co" app="https://app.test"></pawid-button>`;
    const a = document.querySelector("pawid-button")!.shadowRoot!.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("https://app.test/#/share?days=7&venue=Hotel+Bella+%26+Co");
    expect(a.getAttribute("rel")).toBe("noopener");
  });
});

describe("<pawid-travel-check>", () => {
  it("shows sources, keeps needs_review apart, never links javascript:", async () => {
    document.body.innerHTML = `<pawid-travel-check country="it"></pawid-travel-check>`;
    const root = document.querySelector("pawid-travel-check")!.shadowRoot!;
    await vi.waitFor(() => expect(root.textContent).toContain("Coming to"));
    expect(calls.some((c) => c.endsWith("/v1/rules?country=IT"))).toBe(true);
    expect(root.querySelector("b")).toBeNull();
    expect(root.textContent).toContain("1 more rule being checked");
    expect(root.textContent).toContain("PawID has not checked");
    expect([...root.querySelectorAll("a")].some((a) => a.getAttribute("href")?.startsWith("javascript"))).toBe(false);
  });
});

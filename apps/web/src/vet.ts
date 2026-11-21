// "PawID for vets": register once with a passkey, then confirm a pet's microchip and rabies vaccine
// by scanning the owner's code and touching the fingerprint sensor. No app, no password, no software.
import { b64urlDecode, b64urlEncode, confirmChallenge, vetConfirmMessage, vetFieldsSchema, type VetFields } from "@pawid/core";
import { BY_HOSPET } from "@pawid/ui";
import { COUNTRY_GROUPS } from "./countries";
import { button, el, siteFooter, svg, topBar } from "./dom";
import { API, handOver, readRequest, type VetRequest } from "./relay";
import { injectStyles } from "./style";
import { moveToNewAddress } from "./move";
import { RABIES_VACCINES } from "./vaccines";

injectStyles();
moveToNewAddress();
const css = document.createElement("style");
css.textContent = `
.vh { background: var(--pw-navy-800); color: #fff; border-radius: var(--pw-radius-card); padding: 1.5rem; display: grid; gap: .625rem; }
.vh h1 { margin: 0; font-size: clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem); line-height: 1.1; font-weight: 800; letter-spacing: -.03em; }
.vh h1 em { font-style: normal; color: var(--pw-gold-400); }
.vh p { margin: 0; color: rgb(255 255 255 / .85); }
.vsteps { list-style: none; margin: 0; padding: 0; display: grid; gap: .625rem; counter-reset: s; }
.vsteps li { counter-increment: s; display: grid; grid-template-columns: 2rem 1fr; gap: .75rem; align-items: start; }
.vsteps li::before { content: counter(s); display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 9999px; background: var(--pw-gold-100); color: var(--pw-navy-800); font-weight: 800; }
.vsteps span { color: var(--pw-ink-muted); }
.vpet { display: flex; align-items: center; gap: .75rem; margin-bottom: .5rem; }
.vpet img { width: 3rem; height: 3rem; }
.vpet b { font-size: var(--pw-text-lg); }
.vok { display: grid; justify-items: center; text-align: center; gap: .5rem; padding: 2rem 1.25rem; }
.vok .pw-icon { width: 3rem; height: 3rem; color: var(--pw-ok); }
.vstatus { margin: 0; padding: .75rem .875rem; border-radius: var(--pw-radius-control); background: var(--pw-surface-muted); }
`;
document.head.append(css);

interface Me { id: string; name: string; status: string; credentialId: string }
const ME_KEY = "pawid.vet.v1";
const REQ_KEY = "pawid.vet.req.v1";
const loadMe = (): Me | null => { try { return JSON.parse(localStorage.getItem(ME_KEY) ?? "null") as Me | null; } catch { return null; } };
const saveMe = (m: Me) => { try { localStorage.setItem(ME_KEY, JSON.stringify(m)); } catch { /* private mode */ } };
const rpId = location.hostname;
const passkeysOk = typeof PublicKeyCredential !== "undefined" && Boolean(navigator.credentials);

const main = el("main", { id: "main", tabIndex: -1 });
document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, siteFooter());

async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined, credentials: "omit" });
  const data = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`);
  return data;
}

const asAssertion = (cred: PublicKeyCredential) => {
  const res = cred.response as AuthenticatorAssertionResponse;
  return {
    authenticatorData: b64urlEncode(new Uint8Array(res.authenticatorData)),
    clientDataJSON: b64urlEncode(new Uint8Array(res.clientDataJSON)),
    signature: b64urlEncode(new Uint8Array(res.signature)),
  };
};

/** Signs a challenge with the vet's passkey (fingerprint, face or PIN). */
async function passkeySign(challenge: Uint8Array, credentialId?: string): Promise<PublicKeyCredential> {
  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: challenge as BufferSource,
      rpId,
      userVerification: "required",
      timeout: 120_000,
      ...(credentialId ? { allowCredentials: [{ type: "public-key", id: b64urlDecode(credentialId) as BufferSource }] } : {}),
    },
  });
  if (!cred) throw new Error("No passkey chosen.");
  return cred as PublicKeyCredential;
}

async function signIn(): Promise<Me> {
  const at = Math.floor(Date.now() / 1000);
  const cred = await passkeySign(await confirmChallenge(new TextEncoder().encode(`pawid-signin:${at}`)));
  const credentialId = b64urlEncode(new Uint8Array(cred.rawId));
  const v = await api<{ id: string; name: string; status: string }>("/v1/vets/signin", { credentialId, at, assertion: asAssertion(cred) });
  const me = { id: v.id, name: v.name, status: v.status, credentialId };
  saveMe(me);
  return me;
}

const field = (label: string, input: HTMLInputElement | HTMLSelectElement, hint?: string) => {
  input.classList.add("pw-input");
  input.id = `v-${input.name}`;
  return el("div", {}, el("label", { class: "pw-label", htmlFor: input.id }, label), input, hint ? el("p", { class: "pw-hint flush" }, hint) : "");
};

function registerView(after: () => void): Node[] {
  const name = el("input", { name: "name", required: true, maxLength: 120, autocomplete: "name" });
  const country = el("select", { name: "country" }, ...COUNTRY_GROUPS[0]!.items.map((c) => el("option", { value: c.code, selected: c.code === "IT" }, c.name)));
  const body = el("input", { name: "registerBody", required: true, maxLength: 160, placeholder: "Ordine dei Medici Veterinari della Provincia di Milano" });
  const number = el("input", { name: "registerNumber", required: true, maxLength: 40, autocomplete: "off" });
  const clinic = el("input", { name: "clinic", maxLength: 160, autocomplete: "organization" });
  const email = el("input", { name: "email", type: "email", required: true, maxLength: 200, autocomplete: "email" });
  const oath = el("input", { type: "checkbox", name: "oath", required: true });
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const go = button("Create my passkey and register", { kind: "primary", type: "submit" });
  const form = el("form", { class: "pw-card pw-card-pad stack" },
    el("div", { class: "fields fields-2" },
      field("Full name", name),
      field("Country", country),
      field("Professional register", body, "The vets' register you belong to."),
      field("Registration number", number),
      field("Clinic (optional)", clinic),
      field("Email", email, "Only for HosPet.eu to contact you about your registration. Not public."),
    ),
    el("label", { class: "check" }, oath, el("span", {}, el("b", {}, "I am a vet in this register"), el("span", {}, "I will confirm only what I check myself in the pet passport and with a microchip reader."))),
    err,
    el("div", { class: "bar" }, go),
    el("p", { class: "pw-hint flush" }, "Your phone creates a passkey: you will confirm with your fingerprint or face, no password. Your name, register and number become public once approved, so venues can see who confirmed."),
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    if (!form.reportValidity()) return;
    go.disabled = true;
    try {
      const cred = (await navigator.credentials.create({
        publicKey: {
          rp: { id: rpId, name: "PawID for vets" },
          user: { id: crypto.getRandomValues(new Uint8Array(16)) as BufferSource, name: email.value.trim(), displayName: name.value.trim() },
          challenge: crypto.getRandomValues(new Uint8Array(32)) as BufferSource,
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -8 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
          attestation: "none",
          timeout: 120_000,
        },
      })) as PublicKeyCredential | null;
      if (!cred) throw new Error("No passkey was created.");
      const res = cred.response as AuthenticatorAttestationResponse;
      const spki = res.getPublicKey();
      if (!spki) throw new Error("This browser cannot share the passkey's public key. Try Safari, Chrome or Edge, up to date.");
      const credentialId = b64urlEncode(new Uint8Array(cred.rawId));
      const r = await api<{ id: string; status: string }>("/v1/vets", {
        name: name.value.trim(), country: country.value, registerBody: body.value.trim(), registerNumber: number.value.trim(),
        clinic: clinic.value.trim() || undefined, email: email.value.trim(), credentialId, publicKey: b64urlEncode(new Uint8Array(spki)), alg: res.getPublicKeyAlgorithm(),
      });
      saveMe({ id: r.id, name: name.value.trim(), status: r.status, credentialId });
      after();
    } catch (x) {
      err.textContent = (x as Error).name === "NotAllowedError" ? "The passkey was not created. Try again and confirm with your fingerprint, face or PIN." : (x as Error).message;
    } finally {
      go.disabled = false;
    }
  });
  return [el("h1", { class: "page-title" }, "Register as a vet"), form];
}

function statusLine(me: Me): HTMLElement {
  if (me.status === "approved") return el("p", { class: "vstatus" }, svg("checkCircleFill"), ` Signed in as ${me.name}. You can confirm pets.`);
  if (me.status === "pending") return el("p", { class: "pw-notice" }, `Thank you, ${me.name}. HosPet.eu checks your registration number in the register, usually within one working day. Then you can confirm pets.`);
  return el("p", { class: "pw-notice" }, "This vet account cannot confirm pets. Write to info@hospet.eu.");
}

function home(): Node[] {
  const me = loadMe();
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const signin = button("Sign in with my passkey", { kind: "secondary", onClick: async () => {
    err.textContent = "";
    try { await signIn(); route(); } catch (x) { err.textContent = (x as Error).message; }
  } });
  const parts: Node[] = [
    el("section", { class: "vh" },
      el("h1", {}, "PawID for vets: ", el("em", {}, "confirm in 30 seconds.")),
      el("p", {}, "Pet owners copy the passport into PawID. You check the microchip and the rabies vaccine against the passport, and confirm with your fingerprint. Hotels and venues then see \"confirmed by a vet\". No app, no software, free."),
    ),
    el("section", { class: "pw-card pw-card-pad" },
      el("ol", { class: "vsteps" },
        el("li", {}, el("div", {}, el("b", {}, "Register once"), el("br"), el("span", {}, "Name, register and number. HosPet.eu checks them."))),
        el("li", {}, el("div", {}, el("b", {}, "Scan the owner's code"), el("br"), el("span", {}, "With your phone camera, during the visit."))),
        el("li", {}, el("div", {}, el("b", {}, "Check and confirm"), el("br"), el("span", {}, "Correct a date if needed, then touch the fingerprint sensor."))),
      ),
    ),
  ];
  if (!passkeysOk) parts.push(el("p", { class: "pw-notice" }, "This browser does not support passkeys. Use an up to date Safari, Chrome or Edge on your phone."));
  else if (me) parts.push(statusLine(me), el("div", { class: "bar" }, button("Check my status", { kind: "ghost", onClick: async () => { try { await signIn(); route(); } catch (x) { err.textContent = (x as Error).message; } } })), err);
  else parts.push(el("div", { class: "bar" }, el("a", { href: "#/register", class: "pw-btn pw-btn-primary" }, "Register as a vet"), signin), err);
  return parts;
}

function confirmView(req: VetRequest): Node[] {
  const me = loadMe();
  if (!me) {
    try { sessionStorage.setItem(REQ_KEY, location.hash); } catch { /* private mode */ }
    const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
    return [
      el("h1", { class: "page-title" }, `Confirm ${req.d.n || "this pet"}`),
      el("p", { class: "pw-hint" }, "To confirm, sign in with your PawID vet passkey, or register once."),
      el("div", { class: "bar" },
        button("Sign in with my passkey", { kind: "primary", onClick: async () => { try { await signIn(); route(); } catch (x) { err.textContent = (x as Error).message; } } }),
        el("a", { href: "#/register", class: "pw-btn pw-btn-secondary" }, "Register as a vet"),
      ),
      err,
    ];
  }
  if (me.status !== "approved") return [el("h1", { class: "page-title" }, "Not approved yet"), statusLine(me)];

  const chip = el("input", { name: "microchip", value: req.d.c ?? "", inputMode: "numeric", maxLength: 19, required: true, autocomplete: "off" });
  const given = el("input", { name: "given", type: "date", value: req.d.rg ?? "", required: true });
  const until = el("input", { name: "until", type: "date", value: req.d.ru ?? "", required: true });
  const vaccine = el("input", { name: "vaccine", value: req.d.rv ?? "", maxLength: 80, autocomplete: "off" });
  vaccine.setAttribute("list", "v-vaccines");
  const list = el("datalist", { id: "v-vaccines" }, ...RABIES_VACCINES.filter((v) => v.for.includes(req.d.s)).map((v) => el("option", { value: v.name })));
  const checked = el("input", { type: "checkbox", name: "checked", required: true });
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });
  const go = button("Confirm with my passkey", { kind: "primary", type: "submit", icon: "certificate" });
  const form = el("form", { class: "pw-card pw-card-pad stack" },
    el("div", { class: "vpet" }, el("img", { src: `/3d/${req.d.s}.webp`, alt: "", width: 48, height: 48 }), el("div", {}, el("b", {}, req.d.n || "Pet"), el("br"), el("span", { class: "pw-hint" }, req.d.s === "cat" ? "Cat" : "Dog"))),
    el("p", { class: "pw-hint flush" }, "As entered by the owner. Check each value in the passport and correct it if needed."),
    el("div", { class: "fields fields-2" },
      field("Microchip (15 digits)", chip),
      field("Rabies vaccine given on", given),
      field("Valid until", until),
      field("Vaccine (as on the sticker)", vaccine),
    ),
    list,
    el("label", { class: "check" }, checked, el("span", {}, el("b", {}, "I checked these in the passport"), el("span", {}, "and read the microchip, or checked it in the passport I have in front of me."))),
    err,
    el("div", { class: "bar" }, go),
  );
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    if (!form.reportValidity()) return;
    const f = vetFieldsSchema.safeParse({ species: req.d.s, microchip: chip.value.replace(/[\s-]/g, ""), rabiesGivenOn: given.value, rabiesValidUntil: until.value, rabiesVaccine: vaccine.value.trim() || undefined });
    if (!f.success) { err.textContent = "The microchip has 15 digits, and both dates are needed."; return; }
    if (f.data.rabiesValidUntil < f.data.rabiesGivenOn) { err.textContent = "The vaccine can't expire before it was given."; return; }
    go.disabled = true;
    try {
      const fields: VetFields = f.data;
      const at = Math.floor(Date.now() / 1000);
      const cred = await passkeySign(await confirmChallenge(vetConfirmMessage(me.id, at, fields)), me.credentialId);
      const res = await api<unknown>("/v1/vets/confirm", { vetId: me.id, at, fields, assertion: asAssertion(cred) });
      await handOver(req, res);
      try { sessionStorage.removeItem(REQ_KEY); } catch { /* none */ }
      main.replaceChildren(el("section", { class: "pw-card vok", attrs: { role: "status" } }, svg("checkCircleFill"),
        el("h1", { class: "page-title" }, "Confirmed"),
        el("p", {}, `${req.d.n || "The pet"}'s owner sees it on their phone now. Thank you.`)));
    } catch (x) {
      err.textContent = (x as Error).name === "NotAllowedError" ? "Not confirmed. Try again and use your fingerprint, face or PIN." : (x as Error).message;
    } finally {
      go.disabled = false;
    }
  });
  return [el("h1", { class: "page-title" }, "Confirm microchip and rabies vaccine"), form];
}

function route(): void {
  const [path = "", query = ""] = location.hash.replace(/^#\/?/, "").split("?");
  let view: Node[];
  if (path === "confirm") {
    const req = readRequest(new URLSearchParams(query));
    view = req ? confirmView(req) : [el("p", { class: "pw-notice" }, "This code is not complete. Ask the owner to show it again.")];
  } else if (path === "register") {
    view = loadMe() ? home() : registerView(() => {
      // Back to the pet the vet was confirming, if any.
      let back: string | null = null;
      try { back = sessionStorage.getItem(REQ_KEY); } catch { /* none */ }
      location.hash = back ?? "#/";
      route();
    });
  } else {
    view = home();
  }
  document.title = "PawID for vets";
  main.replaceChildren(...view);
}

window.addEventListener("hashchange", route);
route();

// The PawID manifesto: what the EU plans for pets, who asked, what exists, what is missing, and why an
// open source PawID built with contributors can make Europe pet friendly. Every fact has a source below.
import { BY_HOSPET, type IconName } from "@pawid/ui";
import { button, el, revealOnScroll, siteFooter, svg, topBar } from "./dom";
import { moveToNewAddress } from "./move";
import { injectStyles } from "./style";

injectStyles();
moveToNewAddress();

const URL_ = "https://pawid.hospet.eu/manifesto";
const SHARE_TEXT = "Free and open source, for a pet friendly Europe. The EU is studying a digital pet passport: with PawID, vets, venues and pet owners can build it together.";

const css = document.createElement("style");
css.textContent = `
.m-hero { color: #fff; display: grid; gap: 1rem; }
.m-kicker { margin: 0; color: var(--pw-gold-400); font-weight: 800; font-size: .8125rem; letter-spacing: .12em; text-transform: uppercase; }
.m-hero h1 { margin: 0; font-size: clamp(2.125rem, 1.5rem + 2.6vw, 3.25rem); line-height: 1.02; font-weight: 800; letter-spacing: -.04em; text-wrap: balance; }
.m-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.m-hero p { margin: 0; color: rgb(255 255 255 / .88); max-width: 40rem; font-size: var(--pw-text-base); }
.m-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .m-sec { padding: 1.75rem; } }
.m-sec > * { min-width: 0; }
#eu h2 .pw-tile .pw-icon { width: 1.875rem; height: 1.875rem; }
.m-sec h2 { margin: 0; display: flex; align-items: center; gap: .75rem; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.m-sec > p { margin: 0; color: var(--pw-ink-muted); max-width: 44rem; }
.m-time { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
.m-time li { display: grid; grid-template-columns: 6.5rem minmax(0, 1fr); gap: 1rem; padding: .75rem 0; border-top: 1px solid var(--pw-line); }
.m-time li:first-child { border-top: 0; }
.m-time time { font-weight: 800; color: var(--pw-navy-700); font-variant-numeric: tabular-nums; }
.m-time span { color: var(--pw-ink-muted); }
.m-time b { color: var(--pw-ink); }
.m-list { margin: 0; padding: 0; list-style: none; display: grid; gap: .625rem; }
.m-list li { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr); gap: .625rem; color: var(--pw-ink-muted); }
.m-list li .pw-icon { width: 1.375rem; height: 1.375rem; margin-top: .1rem; }
.m-list b { color: var(--pw-ink); }
.m-have .pw-icon { color: var(--pw-ok); }
.m-miss .pw-icon { color: var(--pw-warn); }
.m-why { display: grid; gap: .75rem; }
@media (min-width: 40rem) { .m-why { grid-template-columns: 1fr 1fr; } }
.m-why > div { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); gap: .875rem; padding: 1rem; border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); }
.m-why b { display: block; margin-bottom: .125rem; }
.m-why div > div > span { color: var(--pw-ink-muted); }
.m-join { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr)); gap: .625rem; }
.m-join a { display: grid; grid-template-columns: 2.75rem minmax(0, 1fr); gap: .75rem; align-items: center; padding: .875rem; border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); color: inherit; text-decoration: none; transition: box-shadow 200ms var(--pw-ease-out), translate 200ms var(--pw-ease-out); }
@media (hover: hover) { .m-join a:hover { box-shadow: var(--pw-shadow-lifted); translate: 0 -2px; } }
.m-join a:focus-visible { outline: 3px solid var(--pw-gold-500); outline-offset: 2px; }
.m-join b { display: block; }
.m-join span span { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.m-sign { margin: 0; font-weight: 700; }
.share { display: grid; gap: .75rem; }
.share-row { display: flex; flex-wrap: wrap; gap: .5rem; }
.share-row a, .share-row button { display: inline-grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: 9999px; border: 0; cursor: pointer; color: #fff; text-decoration: none; box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), 0 2px 6px -2px rgb(16 24 40 / .35); transition: translate 160ms var(--pw-ease-out), filter 160ms; }
.share-row a:hover, .share-row button:hover { translate: 0 -2px; filter: brightness(1.08); }
.share-row a:focus-visible, .share-row button:focus-visible { outline: 3px solid var(--pw-gold-500); outline-offset: 2px; }
.share-row .pw-icon { width: 1.25rem; height: 1.25rem; }
.s-x { background: #000; } .s-facebook { background: #1877f2; } .s-linkedin { background: #0a66c2; } .s-whatsapp { background: #25d366; }
.s-telegram { background: #26a5e4; } .s-reddit { background: #ff4500; } .s-bluesky { background: #1185fe; } .s-threads { background: #000; }
.s-instagram { background: radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%); }
.ig-panel { display: grid; gap: .75rem; padding: 1rem; border-radius: var(--pw-radius-card); background: var(--pw-surface); color: var(--pw-ink); box-shadow: var(--pw-shadow-raised); }
.ig-panel[hidden] { display: none; }
.ig-panel > * { margin: 0; min-width: 0; }
.ig-title { display: flex; align-items: center; gap: .5rem; font-weight: 800; }
.ig-title .pw-icon { width: 1.25rem; height: 1.25rem; color: #d6249f; }
.ig-thumbs { display: flex; gap: .5rem; overflow-x: auto; scrollbar-width: none; }
.ig-thumbs a { flex: none; border-radius: .625rem; overflow: hidden; box-shadow: var(--pw-shadow-raised); line-height: 0; }
.ig-thumbs img { display: block; height: 8.4375rem; width: auto; }
.ig-thumbs a:focus-visible { outline: 3px solid var(--pw-gold-500); outline-offset: 2px; }
.ig-caption { font-size: var(--pw-text-xs); resize: vertical; }
.ig-panel [role="status"] { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); min-height: 1rem; }
.m-hero .ig-panel p { color: var(--pw-ink); font-size: var(--pw-text-sm); }
.m-hero .ig-panel [role="status"] { color: var(--pw-ink-muted); font-size: var(--pw-text-xs); }
.s-mail, .s-copy, .s-more { background: var(--pw-navy-800); }
.share [role="status"] { margin: 0; min-height: 1.25rem; font-size: var(--pw-text-xs); color: var(--pw-ink-muted); }
.m-hero .share-row a, .m-hero .share-row button { box-shadow: inset 0 0 0 1px rgb(255 255 255 / .2), 0 2px 6px -2px rgb(0 0 0 / .4); }
.m-hero .share [role="status"] { color: rgb(255 255 255 / .8); }
.m-sources summary { cursor: pointer; font-weight: 800; font-size: var(--pw-text-lg); list-style: none; display: flex; justify-content: space-between; }
.m-sources summary::-webkit-details-marker { display: none; }
.m-sources summary::after { content: "+"; color: var(--pw-ink-muted); font-weight: 600; }
.m-sources[open] summary::after { content: "\\2212"; }
.m-src { margin: 0; padding-left: 1.1rem; display: grid; gap: .375rem; color: var(--pw-ink-muted); font-size: var(--pw-text-xs); overflow-wrap: anywhere; }
`;
document.head.append(css);

const IG_CAPTION = `Free and open source, for a pet friendly Europe. 🐾

The EU is studying a digital pet passport. Until then, a hotel, a restaurant or a museum has no easy way to check a pet's papers.

PawID is our proposal: a free, open source companion to the EU pet passport. Vets confirm the microchip and rabies vaccine, venues check a pet with one scan, and anyone can confirm or correct the travel rules with a source.

Read the manifesto: pawid.hospet.eu/manifesto

#PawID #PetTravel #PetFriendly #DogFriendly #TravelWithPets #EUPetPassport #OpenSource #DogsOfInstagram #CatsOfInstagram`;
const IG_POST = [1, 2, 3, 4].map((i) => `/social/manifesto-${i}.jpg`);
const IG_STORY = "/social/manifesto-story.jpg";

async function filesOf(urls: string[]): Promise<File[]> {
  return Promise.all(urls.map(async (u) => new File([await (await fetch(u)).blob()], u.split("/").pop()!, { type: "image/jpeg" })));
}

/** Instagram has no share link: the post is ready as images plus a caption to paste. */
function instagramPanel(): HTMLElement {
  const status = el("p", { attrs: { role: "status" } });
  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(IG_CAPTION); return true; } catch { return false; }
  };
  const shareImages = async (urls: string[]) => {
    const copied = await copyCaption();
    try {
      const files = await filesOf(urls);
      // Phones: the share sheet lists Instagram. Computers: their share sheet does not, so save the files.
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files })) {
        await navigator.share({ files });
        status.textContent = copied ? "Caption copied: paste it in Instagram." : "";
        return;
      }
    } catch (x) { if ((x as Error).name === "AbortError") return; }
    // No sharing of files here (most computers): download them instead.
    for (const u of urls) el("a", { href: u, download: u.split("/").pop()! }).click();
    status.textContent = `Images saved${copied ? " and caption copied" : ""}. Post them from the Instagram app or instagram.com.`;
  };
  const caption = el("textarea", { class: "pw-input ig-caption", readOnly: true, rows: 6, attrs: { "aria-label": "Caption" } }, IG_CAPTION);
  return el("div", { class: "ig-panel", hidden: true },
    el("p", { class: "ig-title" }, svg("instagram"), "Ready for Instagram"),
    el("div", { class: "ig-thumbs" },
      ...IG_POST.map((u, i) => el("a", { href: u, download: u.split("/").pop()!, attrs: { "aria-label": `Slide ${i + 1}, save` } }, el("img", { src: u, alt: "", width: 108, height: 135, loading: "lazy" }))),
      el("a", { href: IG_STORY, download: "manifesto-story.jpg", class: "ig-story", attrs: { "aria-label": "Story, save" } }, el("img", { src: IG_STORY, alt: "", width: 76, height: 135, loading: "lazy" })),
    ),
    el("div", { class: "bar" },
      button("Share the post (4 images)", { kind: "primary", onClick: () => void shareImages(IG_POST) }),
      button("Share the story", { kind: "secondary", onClick: () => void shareImages([IG_STORY]) }),
      button("Copy caption", { kind: "ghost", icon: "copy", onClick: async () => { status.textContent = (await copyCaption()) ? "Caption copied." : "Select the caption and copy it."; } }),
    ),
    caption,
    status,
  );
}

/** Share links with the text filled in. Each opens the network's own share page in a new tab. */
function shareBar(): HTMLElement {
  const u = encodeURIComponent(URL_);
  const t = encodeURIComponent(SHARE_TEXT);
  const both = encodeURIComponent(`${SHARE_TEXT} ${URL_}`);
  const nets: [string, IconName, string][] = [
    ["x", "x", `https://twitter.com/intent/tweet?text=${t}&url=${u}`],
    ["facebook", "facebook", `https://www.facebook.com/sharer/sharer.php?u=${u}`],
    ["linkedin", "linkedin", `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
    ["whatsapp", "whatsapp", `https://wa.me/?text=${both}`],
    ["telegram", "telegram", `https://t.me/share/url?url=${u}&text=${t}`],
    ["reddit", "reddit", `https://www.reddit.com/submit?url=${u}&title=${encodeURIComponent("Free and open source, for a pet friendly Europe: the PawID manifesto")}`],
    ["bluesky", "bluesky", `https://bsky.app/intent/compose?text=${both}`],
    ["threads", "threads", `https://www.threads.net/intent/post?text=${both}`],
    ["mail", "mail", `mailto:?subject=${encodeURIComponent("Free and open source, for a pet friendly Europe")}&body=${both}`],
  ];
  const label: Record<string, string> = { x: "X", facebook: "Facebook", linkedin: "LinkedIn", whatsapp: "WhatsApp", telegram: "Telegram", reddit: "Reddit", bluesky: "Bluesky", threads: "Threads", mail: "Email" };
  const status = el("p", { attrs: { role: "status" } });
  const row = el("div", { class: "share-row" },
    ...nets.map(([k, icon, href]) => el("a", { class: `s-${k}`, href, target: k === "mail" ? "_self" : "_blank", rel: "noopener", attrs: { "aria-label": `Share on ${label[k]}`, title: label[k]! } }, svg(icon))),
    button("", { onClick: async () => {
      try { await navigator.clipboard.writeText(`${SHARE_TEXT} ${URL_}`); status.textContent = "Text and link copied: paste them anywhere, Instagram stories included."; }
      catch { status.textContent = URL_; }
    } }),
  );
  const copy = row.lastElementChild as HTMLButtonElement;
  copy.className = "s-copy";
  copy.setAttribute("aria-label", "Copy the text and link");
  copy.title = "Copy";
  copy.replaceChildren(svg("copy"));
  const ig = instagramPanel();
  const igBtn = el("button", { type: "button", class: "s-instagram", attrs: { "aria-label": "Post on Instagram", title: "Instagram", "aria-expanded": "false" } }, svg("instagram"));
  igBtn.addEventListener("click", () => { ig.hidden = !ig.hidden; igBtn.setAttribute("aria-expanded", String(!ig.hidden)); });
  row.insertBefore(igBtn, row.querySelector(".s-x"));
  if ("share" in navigator) {
    const more = el("button", { type: "button", class: "s-more", attrs: { "aria-label": "Share with another app", title: "More" } }, svg("share"));
    more.addEventListener("click", () => void navigator.share({ title: "Free and open source, for a pet friendly Europe", text: SHARE_TEXT, url: URL_ }).catch(() => {}));
    row.append(more);
  }
  return el("div", { class: "share" }, row, status, ig);
}

const item = (icon: IconName, title: string, text: string | Node) => el("li", {}, svg(icon), el("span", {}, el("b", {}, title), " ", text));
const sec = (id: string, icon: IconName, title: string, ...body: (Node | string)[]) =>
  el("section", { class: "pw-card m-sec", id }, el("h2", {}, el("span", { class: "pw-tile" }, svg(icon)), title), ...body);
const why = (icon: IconName, title: string, text: string) => el("div", {}, el("span", { class: "pw-tile" }, svg(icon)), el("div", {}, el("b", {}, title), el("span", {}, text)));
const join = (href: string, icon: IconName, title: string, text: string) => el("a", { href, ...(href.startsWith("http") ? { rel: "noopener" } : {}) }, el("span", { class: "pw-tile" }, svg(icon)), el("span", {}, el("b", {}, title), el("span", {}, text)));
const src = (href: string, text: string) => el("li", {}, el("a", { href, class: "pw-link", rel: "noopener" }, text));

const main = el("main", { id: "main" },
  el("section", { class: "m-hero" },
    el("p", { class: "m-kicker" }, "PawID manifesto"),
    el("h1", {}, "Free and open source, ", el("em", {}, "for a pet friendly Europe.")),
    el("p", {}, "Many people travel in Europe with a dog or a cat. The rules are changing, and the European Union is studying a digital pet passport. We think the tools for it should belong to everyone: free, open source, and built with the vets, venues and owners who use them."),
    shareBar(),
  ),

  sec("eu", "eu", "What the EU is doing",
    el("p", {}, "Three changes, all decided in 2026."),
    el("ol", { class: "m-time" },
      el("li", {}, el("time", { attrs: { datetime: "2026-04-22" } }, "22 Apr 2026"), el("span", {}, el("b", {}, "New rules for travelling with pets. "), "Delegated Regulation (EU) 2026/131 replaces the old pet travel rules. A new paper passport model (Implementing Regulation (EU) 2026/705) becomes mandatory for passports issued from 1 January 2028.")),
      el("li", {}, el("time", { attrs: { datetime: "2026-06-17" } }, "17 Jun 2026"), el("span", {}, el("b", {}, "The first EU law on the welfare of dogs and cats. "), "Regulation (EU) 2026/1818: every dog and cat microchipped and registered in a national database, databases linked across the EU, and a free online check of identification and registration. The obligations start for breeders and sellers in 2030, dog owners in 2036 and cat owners in 2041.")),
      el("li", {}, el("time", { attrs: { datetime: "2028" } }, "Until mid 2028"), el("span", {}, el("b", {}, "A digital pet passport, under study. "), "In a statement with the new law, the Commission says it views a digital pet passport favourably and will assess, with the Member States, how to do it, including with the European Digital Identity Wallet. Only then will it consider the legal acts.")),
    ),
  ),

  sec("who", "users", "Who asked for it",
    el("ul", { class: "m-list" },
      item("check", "The Member States.", "In 2022 they asked the Commission for common EU rules on the keeping and sale of dogs, with harmonised traceability."),
      item("check", "The Commission", "proposed the law on 7 December 2023."),
      item("check", "The European Parliament", "voted its position on 28 April 2026, 558 votes to 35. According to the Socialists and Democrats group, Parliament pushed beyond the proposal for the option of a digital pet passport."),
    ),
  ),

  sec("have", "checkCircle", "What exists today",
    el("ul", { class: "m-list m-have" },
      item("checkCircle", "The paper EU pet passport,", "issued by an authorised vet. It is the only document that counts at a border, and it stays that way."),
      item("checkCircle", "National microchip databases", "and networks that tell you in which database a chip is registered, without showing vaccinations."),
      item("checkCircle", "Official travel pages", "from the Commission and each ministry, in their own languages and formats."),
      item("checkCircle", "Pet apps", "where owners keep vaccine dates, each in its own account, and a first national wallet in Greece that shows a pet's microchip and rabies vaccine."),
    ),
  ),

  sec("missing", "warning", "What is missing",
    el("ul", { class: "m-list m-miss" },
      item("warning", "A way for a hotel, a restaurant or a museum to check a pet's papers", "without taking the passport or copying it. The EU's planned check covers identity and registration, not vaccinations."),
      item("warning", "One place for the travel rules,", "each with its official source and the date it was checked, that people and software can reuse."),
      item("warning", "A vet's confirmation that travels with the owner,", "in a format others can check, before the EU's own digital passport exists."),
      item("warning", "Something that works in every country and language,", "and that no single company owns."),
    ),
  ),

  sec("why", "heartHandshake", "Why open source, and why with you",
    el("p", {}, "PawID is our proposal: a free app and toolkit that already does the missing parts, with its code and its rules open for anyone to check, reuse and improve."),
    el("div", { class: "m-why" },
      why("scale", "Rules checked by people who live there", "Each country's rules are a file anyone can correct, with the official source next to every line."),
      why("stethoscope", "Vets stay the issuers", "PawID never creates health data. A registered vet confirms the microchip and rabies vaccine with a fingerprint."),
      why("shieldCheck", "The owner's data stays on the owner's phone", "No account, no central database of pets. The owner chooses what a venue sees, and for how long."),
      why("code", "Ready for the EU's own passport", "Open formats, signatures anyone can check and room for the European Digital Identity Wallet, so nothing is lost when the official digital passport arrives."),
      why("translate", "Every language", "Translations are open to everyone who speaks one, so a vet in Lisbon and a hotel in Tallinn use the same tool."),
      why("hotel", "Free for every venue", "Hotels, restaurants, museums and campsites add PawID with one line of code. No fee, no lock-in."),
    ),
  ),

  sec("join", "paw", "Build it with us",
    el("p", {}, "A pet friendly Europe will not come from one company or one law. It will come from many people adding what they know."),
    el("div", { class: "m-join" },
      join("/vet", "stethoscope", "I am a vet", "Confirm your patients' passports"),
      join("/venues", "hotel", "I run a venue", "Add PawID to your site"),
      join("/rules", "factCheck", "I check facts", "Confirm or correct a rule with a source"),
      join("https://github.com/ovixis/pawid/issues/new?template=country.yml", "scale", "I know my country's rules", "Add a country"),
      join("https://github.com/ovixis/pawid/issues/new?template=translation.yml", "translate", "I speak another language", "Help translate"),
      join("/ai", "code", "I build software", "API, MCP and open code"),
      join("/support", "heartHandshake", "I support this", "Add your name"),
    ),
    el("p", { class: "m-sign" }, "HosPet.eu, November 2026"),
    el("p", { class: "pw-hint flush" }, "PawID is not an official document and not an EU project. The EU pet passport, issued by an authorised vet, is the official document."),
  ),

  el("section", { class: "pw-card m-sec", id: "share" },
    el("h2", {}, el("span", { class: "pw-tile" }, svg("share")), "Share the manifesto"),
    el("p", {}, "The text is ready, change it if you like."),
    shareBar(),
  ),

  el("details", { class: "pw-card m-sec m-sources", id: "sources" },
    el("summary", {}, "Sources (7)"),
    el("ul", { class: "m-src" },
      src("https://eur-lex.europa.eu/eli/reg/2026/1818/oj/eng", "Regulation (EU) 2026/1818 on the welfare of dogs and cats and their traceability (EUR-Lex)"),
      src("https://data.europarl.europa.eu/distribution/doc/TA-10-2026-0115_en.pdf", "European Parliament, position of 28 April 2026, with the Commission statement on the pet passport"),
      src("https://oeil.europarl.europa.eu/oeil/en/document-summary?id=1899832", "European Parliament Legislative Observatory, procedure 2023/0447(COD)"),
      src("https://data.consilium.europa.eu/doc/document/ST-16406-2023-INIT/EN/pdf", "Commission proposal COM(2023) 769 of 7 December 2023"),
      src("https://socialistsanddemocrats.eu/newsroom/eu-set-improve-health-and-wellbeing-dogs-and-cats-thanks-sds", "Socialists and Democrats group, on the digital pet passport option"),
      src("https://food.ec.europa.eu/animals/live-animal-movements/dogs-cats-and-ferrets/travelling-pet-within-eu_en", "European Commission, travelling with a pet within the EU (Regulations 2026/131 and 2026/705)"),
      src("https://in.gr/2024/08/06/english-edition/pet-registration-data-goes-digital-greece/amp", "Greece: pet registration data in the state wallet app (in.gr)"),
    ),
  ),
);

document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, siteFooter());
revealOnScroll(document);

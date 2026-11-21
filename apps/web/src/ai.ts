// "PawID for AI assistants": copy and paste steps to connect the PawID MCP server or skill to
// Claude Code, Claude, ChatGPT, Cursor, VS Code or any MCP client, and one text to paste in any chat.
import { BY_HOSPET, type IconName } from "@pawid/ui";
import { CODE_WINDOW_CSS, codeWindow } from "./codewin";
import { button, el, revealOnScroll, siteFooter, svg, topBar } from "./dom";
import { moveToNewAddress } from "./move";
import { injectStyles } from "./style";

injectStyles();
moveToNewAddress();

const MCP = "https://pawid-api.hospet.workers.dev/mcp";
const SKILL = "https://raw.githubusercontent.com/ovixis/pawid/main/skills/pawid/SKILL.md";
const OPENAPI = "https://pawid-api.hospet.workers.dev/v1/openapi.json";

const css = document.createElement("style");
css.textContent = `${CODE_WINDOW_CSS}
.a-hero { color: #fff; display: grid; gap: .875rem; }
.a-hero h1 { margin: 0; font-size: clamp(1.875rem, 1.4rem + 1.8vw, 2.625rem); line-height: 1.06; font-weight: 800; letter-spacing: -.035em; text-wrap: balance; }
.a-hero h1 em { font-style: normal; color: var(--pw-gold-400); }
.a-hero p { margin: 0; color: rgb(255 255 255 / .86); max-width: 40rem; }
.a-hero .row { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
.a-hero [role="status"] { margin: 0; color: #fff; font-weight: 600; min-height: 1.5rem; }
.a-sec { display: grid; gap: 1rem; padding: 1.25rem; }
@media (min-width: 40rem) { .a-sec { padding: 1.5rem; } }
.a-sec > * { min-width: 0; }
.a-sec h2 { margin: 0; font-size: var(--pw-text-2xl); font-weight: 800; letter-spacing: -.02em; }
.a-sec > p { margin: 0; color: var(--pw-ink-muted); }
.tool { border-radius: var(--pw-radius-card); background: linear-gradient(180deg, var(--pw-surface), var(--pw-canvas)); box-shadow: var(--pw-shadow-raised); }
.tool summary { display: flex; align-items: center; gap: .875rem; min-height: 3.75rem; padding: .625rem 1rem; cursor: pointer; list-style: none; }
.tool summary::-webkit-details-marker { display: none; }
.tool summary::after { content: "+"; margin-left: auto; color: var(--pw-ink-muted); font-weight: 600; font-size: 1.25rem; }
.tool[open] summary::after { content: "\\2212"; }
.tool summary b { display: block; font-size: var(--pw-text-base); }
.tool summary small { color: var(--pw-ink-muted); }
.tool-in { display: grid; gap: .75rem; padding: 0 1rem 1rem; min-width: 0; }
.tool-in ol { margin: 0; padding-left: 1.25rem; display: grid; gap: .25rem; color: var(--pw-ink-muted); }
.tool-in .bar { margin-top: .25rem; }
.tools { display: grid; gap: .625rem; }
.a-tools-list { margin: 0; padding-left: 1.1rem; display: grid; gap: .375rem; color: var(--pw-ink-muted); }
.a-tools-list b { color: var(--pw-ink); }
`;
document.head.append(css);

/** The text people paste into any AI chat. */
const PROMPT = `Use PawID for pet travel in Europe and for PawID pet cards.
MCP server (no key): ${MCP}
Tools: verify_pet_card, get_pet_travel_rules, list_rule_countries
Without MCP, the same as an API: ${OPENAPI}
Instructions: ${SKILL}
When you answer: cite the official source of every rule, say when a rule is still being checked, and say a pet card is declared by the owner unless a vet confirmed it. PawID is not an official document.`;

async function copyText(text: string, status: HTMLElement): Promise<void> {
  try { await navigator.clipboard.writeText(text); status.textContent = "Copied. Paste it in your AI assistant."; }
  catch { status.textContent = "Copy did not work here. Select the text below and copy it."; }
}

const tool = (id: string, icon: IconName, title: string, sub: string, ...body: (Node | string)[]) =>
  el("details", { class: "tool", id },
    el("summary", {}, el("span", { class: "pw-tile" }, svg(icon)), el("span", {}, el("b", {}, title), el("small", {}, sub))),
    el("div", { class: "tool-in" }, ...body));
const steps = (...items: (Node | string)[][]) => el("ol", {}, ...items.map((i) => el("li", {}, ...i)));
const linkBtn = (href: string, label: string, icon: IconName) => el("a", { href, class: "pw-btn pw-btn-primary", rel: "noopener" }, svg(icon), label);

const b64 = (s: string) => btoa(s);
const cursorLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=pawid&config=${encodeURIComponent(b64(JSON.stringify({ url: MCP })))}`;
const vscodeLink = `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "pawid", type: "http", url: MCP }))}`;

const status = el("p", { attrs: { role: "status" } });
const main = el("main", { id: "main" },
  el("section", { class: "a-hero" },
    el("h1", {}, "PawID in your ", el("em", {}, "AI assistant.")),
    el("p", {}, "Ask your AI what a dog needs to travel to France, or to check a PawID card a guest sent you. It answers from PawID's rules, each with its official source. Copy one line, paste it in your tool."),
    el("div", { class: "row" }, button("Copy for your AI", { kind: "primary", icon: "copy", onClick: () => void copyText(PROMPT, status) }), el("a", { href: "#tools", class: "pw-btn pw-btn-secondary" }, "Set up a tool")),
    status,
  ),
  el("section", { class: "pw-card a-sec" },
    el("h2", {}, "Paste in any AI chat"),
    el("p", {}, "Works in any assistant that can read links or use MCP. The button above copies the same text."),
    codeWindow({ file: "pawid-for-ai.txt", code: PROMPT, lang: "sh", what: "the text for your AI", result: { label: "Then ask", text: "\"What does my dog need to go to Spain in May?\"" } }),
  ),
  el("section", { class: "pw-card a-sec", id: "tools" },
    el("h2", {}, "Set up your tool"),
    el("p", {}, "PawID's MCP server is free and needs no key. It can verify a pet card and read the travel rules; it cannot change anything."),
    el("div", { class: "tools" },
      tool("claude-code", "terminal", "Claude Code", "One command in the terminal",
        codeWindow({ file: "terminal", code: `claude mcp add --transport http pawid ${MCP}`, lang: "sh", what: "the Claude Code command", result: { label: "Then", text: "/mcp shows pawid as connected" } }),
        el("p", { class: "pw-hint flush" }, "Want the instructions too? Add the skill:"),
        codeWindow({ file: "terminal", code: `mkdir -p ~/.claude/skills/pawid && curl -fsSL ${SKILL} -o ~/.claude/skills/pawid/SKILL.md`, lang: "sh", what: "the skill install command", result: { label: "Then", text: "Claude uses PawID when you ask about pet travel" } }),
      ),
      tool("claude", "chatbot", "Claude (web, desktop, mobile)", "Add a custom connector",
        steps(["Open ", el("b", {}, "Settings"), ", then ", el("b", {}, "Connectors"), "."], ["Choose ", el("b", {}, "Add custom connector"), ", name it PawID and paste this address."], ["In a chat, turn PawID on from the tools menu."]),
        codeWindow({ file: "connector URL", code: MCP, lang: "sh", what: "the connector address", result: { label: "Name", text: "PawID" } }),
      ),
      tool("chatgpt", "openai", "ChatGPT", "Add a connector, where your plan allows it",
        steps(["Open ", el("b", {}, "Settings"), ", then ", el("b", {}, "Apps & Connectors"), " (developer mode may need to be on)."], ["Create a connector with this address, no authentication."], ["Without connectors: use ", el("b", {}, "Paste in any AI chat"), " above."]),
        codeWindow({ file: "connector URL", code: MCP, lang: "sh", what: "the connector address", result: { label: "Auth", text: "None" } }),
      ),
      tool("cursor", "code", "Cursor", "One click, or add it to mcp.json",
        el("div", { class: "bar" }, linkBtn(cursorLink, "Add to Cursor", "download")),
        codeWindow({ file: ".cursor/mcp.json", code: JSON.stringify({ mcpServers: { pawid: { url: MCP } } }, null, 2), lang: "sh", what: "the Cursor configuration", result: { label: "Then", text: "PawID appears under MCP tools" } }),
      ),
      tool("vscode", "vscode", "VS Code", "One click, or one command",
        el("div", { class: "bar" }, linkBtn(vscodeLink, "Add to VS Code", "download")),
        codeWindow({ file: "terminal", code: `code --add-mcp '${JSON.stringify({ name: "pawid", type: "http", url: MCP })}'`, lang: "sh", what: "the VS Code command", result: { label: "Then", text: "use PawID in Copilot agent mode" } }),
      ),
      tool("other", "robot", "Any other MCP client", "Streamable HTTP, no key",
        codeWindow({ file: "mcp.json", code: JSON.stringify({ mcpServers: { pawid: { type: "http", url: MCP } } }, null, 2), lang: "sh", what: "the MCP configuration", result: { label: "Tools", text: "verify_pet_card, get_pet_travel_rules, list_rule_countries" } }),
      ),
      tool("skill", "fileText", "Skill file for agents", "SKILL.md, plain instructions",
        el("p", { class: "pw-hint flush" }, "For agents that read skills or instruction files. It explains the API, the MCP tools and how to answer."),
        codeWindow({ file: "SKILL.md", code: SKILL, lang: "sh", what: "the skill address", result: { label: "Licence", text: "Apache-2.0" } }),
      ),
    ),
  ),
  el("section", { class: "pw-card a-sec" },
    el("h2", {}, "What your assistant can do"),
    el("ul", { class: "a-tools-list" },
      el("li", {}, el("b", {}, "verify_pet_card: "), "checks a PawID code or link from a guest: genuine, unchanged, not expired, and whether a vet confirmed the microchip and rabies vaccine."),
      el("li", {}, el("b", {}, "get_pet_travel_rules: "), "the EU rules and a country's own rules, each with its official source and the date it was checked."),
      el("li", {}, el("b", {}, "list_rule_countries: "), "the countries PawID has checked so far."),
    ),
    el("p", { class: "pw-hint flush" }, "Read only: the assistant cannot see your pets or change anything. ", el("a", { href: OPENAPI, class: "pw-link" }, "OpenAPI"), ". ", el("a", { href: "/llms.txt", class: "pw-link" }, "llms.txt"), "."),
  ),
);
document.getElementById("app")!.replaceChildren(topBar("/", BY_HOSPET.href), main, siteFooter());
revealOnScroll(document);

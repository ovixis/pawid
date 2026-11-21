import type { Pet } from "@pawid/core";
import { longDate } from "@pawid/ui";
import { backupFromText, decodeBackup, encodeBackup, lastBackup, makeBackup, markBackedUp, mergePets, restoreLink, type Backup } from "../backup";
import { button, el, svg, today } from "../dom";

const fileName = () => `pawid-backup-${today()}.json`;
const names = (pets: Pet[]) => pets.map((p) => p.name).join(", ");

/** Home page card: email a backup to yourself, save it as a file, or restore one. */
export function backupCard(pets: Pet[], owner: string): HTMLElement {
  const last = lastBackup();
  const lastDay = last?.slice(0, 10);
  const changed = lastDay ? pets.filter((p) => (p.updatedAt ?? "") > lastDay) : [];
  const status = el("p", { class: "pw-hint flush", attrs: { role: "status" } });
  const setStatus = () => {
    const l = lastBackup();
    status.textContent = l
      ? `Last backup: ${longDate(l.slice(0, 10))}.${changed.length && l === last ? ` ${names(changed)} changed since then.` : ""}`
      : "No backup yet. If you lose this phone or clear the browser data, your pets' details are gone.";
  };
  setStatus();

  const email = button("Email me a backup", { kind: "primary", icon: "share", onClick: async () => {
    const backup = makeBackup(pets, owner);
    const link = restoreLink(await encodeBackup(backup));
    const body = [
      `Your PawID backup of ${longDate(today())}, with ${names(pets)}.`,
      "",
      "To restore it, open this link on your phone:",
      link,
      "",
      "Using the PawID app from the iPhone Home Screen? Open the app, tap Restore a backup, and paste this link.",
      "",
      "This link holds your pets' details (microchip, vaccine dates, vet). Keep this email private. PawID keeps no copy.",
    ].join("\n");
    markBackedUp();
    setStatus();
    location.href = `mailto:?subject=${encodeURIComponent(`PawID backup, ${longDate(today())}`)}&body=${encodeURIComponent(body)}`;
  } });

  const file = button("Save a file", { icon: "download", onClick: async () => {
    const f = new File([JSON.stringify(makeBackup(pets, owner), null, 2)], fileName(), { type: "application/json" });
    // Phones: the share sheet (Mail, Drive, Files...). Computers: a download.
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: "PawID backup" }); markBackedUp(); setStatus(); } catch { /* closed */ }
      return;
    }
    const url = URL.createObjectURL(f);
    const a = el("a", { href: url, download: f.name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    markBackedUp();
    setStatus();
  } });

  return el(
    "section",
    { class: "pw-card pw-card-pad backup", attrs: { "aria-labelledby": "backup-title" } },
    el("div", { class: "pw-card-head" }, el("h2", { id: "backup-title" }, "Backup")),
    el("p", { class: "pw-hint lead" }, "Your pets' details live only on this phone. Send yourself a backup by email: one tap on its link puts everything back on any phone."),
    status,
    el("div", { class: "bar" }, email, file, el("a", { href: "#/restore", class: "pw-btn pw-btn-ghost" }, "Restore a backup")),
  );
}

/** #/restore?b=<code>: shows what is in the backup and restores it. Without a code: paste a link or pick a file. */
export function restoreView(code: string | null, current: Pet[], onRestore: (pets: Pet[], owner?: string) => void, moved = false): Node[] {
  const out = el("div", { class: "stack", attrs: { "aria-live": "polite" } });
  const err = el("p", { class: "pw-error", attrs: { role: "alert" } });

  const show = (b: Backup) => {
    const same = b.pets.filter((p) => current.some((c) => c.id === p.id));
    out.replaceChildren(
      el("section", { class: "pw-card pw-card-pad" },
        el("div", { class: "pw-card-head" }, el("h2", {}, `Backup of ${longDate(b.createdAt.slice(0, 10))}`)),
        el("ul", { class: "restore-list" }, ...b.pets.map((p) => el("li", {}, el("img", { src: `/3d/${p.species === "cat" ? "cat" : "dog"}.webp`, alt: "", width: 32, height: 32 }), el("b", {}, p.name), el("span", {}, p.breed ?? (p.species === "cat" ? "Cat" : "Dog"))))),
        same.length ? el("p", { class: "pw-notice" }, `${names(same)} ${same.length === 1 ? "is" : "are"} already on this phone: the backup replaces ${same.length === 1 ? "it" : "them"}. Other pets stay.`) : "",
        el("div", { class: "bar" },
          button("Restore", { kind: "primary", icon: "check", onClick: () => onRestore(mergePets(current, b.pets), b.owner) }),
          el("a", { href: "#/", class: "pw-btn pw-btn-ghost" }, "Cancel"),
        ),
      ),
    );
  };

  const paste = el("textarea", { class: "pw-input", rows: 3, id: "restore-paste", attrs: { placeholder: "https://pawid.hospet.eu/#/restore?b=…" } });
  const pick = el("input", { type: "file", accept: ".json,application/json", id: "restore-file", class: "pw-input" });
  const tryText = async (text: string) => {
    err.textContent = "";
    const b = await backupFromText(text);
    if (b) show(b);
    else err.textContent = "This is not a PawID backup, or it is damaged. Use the link from the backup email or the backup file.";
  };
  paste.addEventListener("input", () => { if (paste.value.trim().length > 20) void tryText(paste.value); });
  pick.addEventListener("change", async () => { const f = pick.files?.[0]; if (f && f.size < 2_000_000) void tryText(await f.text()); });

  const manual = el("section", { class: "pw-card pw-card-pad" },
    el("div", { class: "pw-card-head" }, el("h2", {}, "Restore a backup")),
    el("div", { class: "fields" },
      el("div", {}, el("label", { class: "pw-label", htmlFor: "restore-paste" }, "Paste the link from your backup email"), paste),
      el("div", {}, el("label", { class: "pw-label", htmlFor: "restore-file" }, "Or choose the backup file"), pick),
    ),
  );

  if (code) {
    void decodeBackup(code).then((b) => (b ? show(b) : (err.textContent = "This backup link is damaged or incomplete. Copy the whole link from the email.")));
  }
  return [
    el("div", { class: "bar no-print" }, el("a", { href: "#/", class: "back" }, svg("back"), "Your pets")),
    el("h1", { class: "page-title" }, moved ? "PawID has a new address" : "Restore your pets"),
    moved ? el("p", { class: "pw-notice" }, "PawID moved from pawid.pages.dev to pawid.hospet.eu. Your pets came along: tap Restore to keep them here. If you installed the app, install it again from this address.") : "",
    err,
    out,
    code ? "" : manual,
  ].filter(Boolean) as Node[];
}

import { describe, expect, it, vi } from "vitest";
import type { Pet } from "@pawid/core";
import { backupFromText, decodeBackup, encodeBackup, makeBackup, mergePets, readBackup } from "../src/backup";
import { googleCalendarUrl, nextRabiesExpiry, rabiesReminderIcs } from "../src/calendar";

vi.stubGlobal("location", { origin: "https://pawid.hospet.eu" });

const luna: Pet = {
  id: "luna", species: "dog", name: "Luna, the <b>best</b>; dog", breed: "Border Collie", microchip: "380260000123456",
  vaccinations: [{ kind: "rabies", administeredOn: "2026-03-01", validUntil: "2029-03-01" }], treatments: [], updatedAt: "2026-11-21",
} as Pet;

describe("calendar reminder", () => {
  const ics = rabiesReminderIcs(luna, "2029-03-01", "1 March 2029", new Date("2026-11-21T10:00:00Z"));
  it("is an all-day event on the expiry date with three alarms", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20290301\r\n");
    expect(ics).toContain("DTEND;VALUE=DATE:20290302\r\n");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(3);
    expect(ics).toContain("TRIGGER:-P29DT15H");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });
  it("escapes text and folds long lines", () => {
    expect(ics.replace(/\r\n /g, "")).toContain("SUMMARY:Luna\\, the <b>best</b>\\; dog: rabies vaccine expires");
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
  it("keeps the same UID for the same pet and date", () => {
    expect(rabiesReminderIcs(luna, "2029-03-01", "x").match(/UID:[^\r]+/)?.[0]).toBe(ics.match(/UID:[^\r]+/)?.[0]);
  });
  it("skips expired vaccines", () => {
    expect(nextRabiesExpiry(luna, "2026-11-21")).toBe("2029-03-01");
    expect(nextRabiesExpiry(luna, "2029-03-02")).toBeUndefined();
  });
  it("builds a Google Calendar link", () => {
    expect(googleCalendarUrl(luna, "2029-03-01", "1 March 2029")).toContain("dates=20290301%2F20290302");
  });
});

describe("backup", () => {
  it("round trips through a restore link", async () => {
    const code = await encodeBackup(makeBackup([luna], "Marta"));
    const back = await backupFromText(`https://pawid.hospet.eu/#/restore?b=${code}`);
    expect(back?.pets[0]?.name).toBe(luna.name);
    expect(back?.owner).toBe("Marta");
    expect(code.length).toBeLessThan(1200);
  });
  it("reads a backup file", async () => {
    expect((await backupFromText(JSON.stringify(makeBackup([luna], ""))))?.pets).toHaveLength(1);
  });
  it("refuses damaged or foreign data", async () => {
    expect(await decodeBackup("g.not-base64-gzip")).toBeNull();
    expect(await decodeBackup("x.abc")).toBeNull();
    expect(readBackup({ app: "other", v: 1, pets: [luna] })).toBeNull();
    expect(readBackup({ app: "pawid", v: 1, pets: [{ id: "x", name: "" }] })).toBeNull();
  });
  it("replaces pets with the same id and keeps the others", () => {
    const max = { ...luna, id: "max", name: "Max" };
    const merged = mergePets([luna, max], [{ ...luna, name: "Luna 2" }]);
    expect(merged.map((p) => p.name)).toEqual(["Luna 2", "Max"]);
  });
});

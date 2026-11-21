// Reminders in the phone's own calendar, made on the device: an .ics event with alarms.
// Nothing is sent to a server. Opening the file adds the event to Apple Calendar, Google Calendar,
// Outlook or any calendar app; the calendar rings the alarms, even when PawID is closed.
import type { Pet } from "@pawid/core";

const ALARMS: { trigger: string; when: string }[] = [
  // Relative to the all-day event's start (00:00 on the expiry day): 9:00 local time on each day.
  { trigger: "-P29DT15H", when: "in 30 days" },
  { trigger: "-P6DT15H", when: "in 7 days" },
  { trigger: "-PT15H", when: "tomorrow" },
];

/** The latest rabies vaccine of a pet, if it has not expired yet. */
export function nextRabiesExpiry(pet: Pet, todayIso: string): string | undefined {
  const v = pet.vaccinations.filter((x) => x.kind === "rabies").sort((a, b) => b.validUntil.localeCompare(a.validUntil))[0];
  return v && v.validUntil >= todayIso ? v.validUntil : undefined;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (iso: string) => iso.replace(/-/g, "");
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Lines over 75 bytes are folded, as the iCalendar format asks (RFC 5545, 3.1). */
function fold(line: string): string {
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  for (const ch of line) {
    const b = new TextEncoder().encode(ch).length;
    if (bytes + b > 74) { out.push(cur); cur = " "; bytes = 1; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

export function rabiesReminderIcs(pet: Pet, validUntil: string, longDate: string, nowUtc = new Date()): string {
  const stamp = nowUtc.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const title = `${pet.name}: rabies vaccine expires`;
  const text = `${pet.name}'s rabies vaccine is valid until ${longDate}, as written in the pet passport. Book the vet for the booster before this date, so ${pet.name} can keep travelling. Reminder made by PawID on your phone.`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HosPet.eu//PawID//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Same pet and date = same UID, so adding it twice updates the event instead of making a copy.
    `UID:pawid-${pet.id.replace(/[^A-Za-z0-9-]/g, "")}-rabies-${ymd(validUntil)}@pawid.pages.dev`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(validUntil)}`,
    `DTEND;VALUE=DATE:${ymd(nextDay(validUntil))}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(text)}`,
    "TRANSP:TRANSPARENT",
    ...ALARMS.flatMap((a) => [
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`${pet.name}'s rabies vaccine expires ${a.when}. Book the vet.`)}`,
      `TRIGGER:${a.trigger}`,
      "END:VALARM",
    ]),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** Google Calendar's own "add event" page, for Android phones that do not open .ics files. */
export function googleCalendarUrl(pet: Pet, validUntil: string, longDate: string): string {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `${pet.name}: rabies vaccine expires`,
    dates: `${ymd(validUntil)}/${ymd(nextDay(validUntil))}`,
    details: `${pet.name}'s rabies vaccine is valid until ${longDate}. Book the vet for the booster before this date. Set an alert 30 days before. Made by PawID.`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Hands the .ics file to the phone: the calendar app opens it and asks to add the event. */
export function openIcs(ics: string, fileName: string): void {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

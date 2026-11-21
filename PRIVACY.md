# PawID privacy

Last updated: 21 November 2026

PawID is an open source app by [HosPet.eu](https://hospet.eu). This page says what happens to your
data in the PawID app (pawid.pages.dev), the PawID API (pawid-api.hospet.workers.dev) and the
components venues add to their sites. Everything here can be checked in the code of this repository.

PawID is not an official document. The EU pet passport, issued by an authorised vet, is.

## In short

- Your pets' details stay on your phone. PawID has no accounts and no copy of your pets.
- A code you show or send holds only the details you chose, and stops working when it expires.
- Reminders and backups are made on your phone. PawID sends no email and keeps no copy.
- PawID counts how it is used, by day, without IP addresses, cookies or pet data.

## Your pets' details

What you type in the app (name, breed, microchip, passport number, vaccine dates, vet, notes)
is saved in your browser's storage on your phone (localStorage). It is not sent to PawID or HosPet.eu.

If you delete the app, clear the browser data or lose the phone, the details are gone, unless you
made a backup (see below).

On an iPhone, the app on the Home Screen and Safari keep separate storage.

## The signing key

The app makes a signing key on your phone the first time you make a code. It stays on the phone
and is used only to sign your codes, so a venue can see they were not changed. It is not in backups.

## Codes you show or send

When you make a code, you choose what goes on it: the pet's name and species always, and if you tick
them, the microchip and description, the rabies vaccine dates, the passport number and home country,
your vet, your notes and your first name.

These details are inside the code itself (in the QR code and the link). They are not stored on a
server. Anyone who has the code can read them until it expires: 15 minutes or 7 days, as you choose.
Treat a 7 day link like a photo of the pet card: send it only to the place you are going to.

When a venue opens the code, the PawID API checks the signature and shows the card. The API does
not save the code or the details in it, and keeps no logs of them.

## Reminders

"Add to my calendar" makes a calendar file on your phone with the rabies vaccine date and three
alarms. Your calendar app keeps it. PawID does not see it.

"Google Calendar" opens Google's own page to add the event. Then the pet's name and the date go to
Google, under Google's privacy policy. Use "Add to my calendar" if you do not want that.

## Backups

"Email me a backup" opens your own email app with a message to yourself. The message holds a link
with your pets' details packed inside it, after the "#" in the address, which browsers never send
to a server. "Save a file" saves or shares a file with the same details.

PawID does not send the email and keeps no copy. The email and the file are in your own mailbox and
storage: keep them private, because they hold your pets' details.

## What PawID counts

The API keeps daily counters in a database in the EU (Cloudflare D1, EU jurisdiction):
the day, what happened, one detail and a number. For example:

- a venue component was loaded, and the host name of the site that loaded it;
- a code was checked, and the country of the request (from Cloudflare), or the kind of client;
- an API or MCP call, and the kind of client (for example "browser" or the tool's name).

The counters have no IP addresses, no cookies, no codes and no pet data. They are kept for about
13 months, then deleted automatically. HosPet.eu uses them to see whether PawID is used.

To stop one script from overloading the API, it remembers how many requests each IP address made
in the last minute, in memory only. This is never written to a database.

## Who processes what

- **Cloudflare** hosts the app and the API. Like any host, it handles connection data such as IP
  addresses to deliver and protect the service, under the
  [Cloudflare privacy policy](https://www.cloudflare.com/privacypolicy/).
- **GitHub** hosts this source code and the issues. What you write in an issue is public.
- PawID uses no analytics service, no ads and no third party scripts. Fonts and icons are served
  from PawID itself.

## Venues that use the PawID components

The components on a venue's site load from pawid.pages.dev and talk to the PawID API. They set no
cookies. The scanner uses the camera only after staff press "Scan", and the picture never leaves the
device: only the code found in it is checked. The venue's own pet rules are the venue's, and the
venue's own privacy policy applies to its site.

## Your rights

Your pets' details are only on your phone, so you can see, change and delete them in the app.
The counters cannot be linked to you.

Questions: open an issue on GitHub, or write to info@hospet.eu.

## Changes

When this page changes, the change is in this repository's history, with its date.

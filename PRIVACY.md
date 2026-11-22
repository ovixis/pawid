# PawID privacy

Last updated: 22 November 2026

PawID is an open source app by [HosPet.eu](https://hospet.eu). This page says what happens to your
data in the PawID app (pawid.hospet.eu; the first address, pawid.pages.dev, now sends you there), the PawID API (pawid-api.hospet.workers.dev) and the
components venues add to their sites. Everything here can be checked in the code of this repository.

PawID is not an official document. The EU pet passport, issued by an authorised vet, is.

## In short

- Your pets' details stay on your phone. PawID has no accounts and no copy of your pets.
- A code you show or send holds only the details you chose, and stops working when it expires, or earlier if you stop it.
- Reminders and backups are made on your phone. PawID sends no email and keeps no copy.
- PawID counts how it is used, by day, without IP addresses, cookies or pet data.
- Vets who confirm pets register with their name and professional register number, which are public once approved.

## All the data, at a glance

| What | Where it is kept | For how long | How to delete or correct it |
|---|---|---|---|
| Your pets' details, the sticker photo, your first name | Your phone only (browser storage) | Until you delete them | Edit or delete the pet in the app, or clear the site's data |
| Your signing key and the codes you made | Your phone only | Codes are forgotten when they expire | Clear the site's data |
| A code you show or send | Inside the QR code or link, with whoever has it | 15 minutes or 7 days | Stop it in the app: it stops working at once |
| A code you stopped | PawID server: a hash of the code's signature and its expiry, never its content | Until the code would have expired | Deleted automatically |
| Vet confirmation | Your phone, and inside the codes you choose to share | As long as you keep it | Delete or edit the pet; editing the microchip or rabies dates removes it |
| Pairing with your vet | PawID server, encrypted end to end (PawID cannot read it) | Up to 15 minutes, 30 while the vet checks | Deleted automatically every day |
| Digital credential (W3C) | Made on request and sent back to you; not stored | Not kept | Nothing to delete on the server |
| Vets: name, country, register and number, clinic, email, passkey public key | PawID server | While registered | Write to info@hospet.eu; the email is never public |
| Statements of support | PawID server | Until you ask | Write to info@hospet.eu |
| Fact checks on the travel rules | PawID server | Until you ask | Write to info@hospet.eu |
| Usage counters (no IP, no cookies, no pet data) | PawID server | About 13 months | Deleted automatically |
| Your network address, to limit abuse | In memory on the server for a few minutes | Minutes | Never written to disk |

No artificial intelligence reads your pets' data. An AI assistant connected to PawID (MCP) can only
check a code that you, or someone you gave it to, pastes in.

## Your pets' details

What you type in the app (name, breed, microchip, passport number, vaccine dates, vet, notes)
is saved in your browser's storage on your phone (localStorage). It is not sent to PawID or HosPet.eu.

If you delete the app, clear the browser data or lose the phone, the details are gone, unless you
made a backup (see below).

On an iPhone, the app on the Home Screen and Safari keep separate storage.

## Photo of the vaccine sticker

If you add a photo of the rabies vaccine sticker, it is made smaller and kept on your phone only.
It shows on your own pet card. It is not in the codes you share and not in backups.
Deleting the pet deletes the photo.

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

## Vet confirmation

You can ask your vet to confirm your pet's microchip and rabies vaccine. Your phone gets a 6 digit
code from the PawID API (valid 15 minutes); you read it to your vet, send it, or show it as a QR.
Your vet types it on their phone after signing in with their passkey. Both phones then show the same
2 digit number: you check it matches and tap "Yes, that's my vet", or "No" to cancel.

The two phones agree on a key that only they know (each makes a one-time key pair; the API passes the
public halves along). Only after you say yes, your phone sends the microchip and rabies details to
the vet, encrypted with that key. When the vet confirms, their phone sends those details once to the
PawID API, which checks the vet's passkey, seals the details and sends them back without keeping
them. The vet's phone encrypts the result for your phone. The API holds only public keys, the code,
and ciphertext it cannot read, and deletes everything when your phone collects the answer, or after
at most 45 minutes.

The confirmation is kept on your phone with your pet. When you share a code, it goes along only if
the microchip and rabies details are still the ones the vet confirmed.

### Vets

Vets register at pawid.hospet.eu/vet with their name, country, professional register, registration
number, clinic (optional) and email. HosPet.eu checks the number in the professional register before
approving. Once approved, the name, register, number, country and clinic are public, because venues see
who confirmed a pet. The email is only used by HosPet.eu to contact the vet about the registration.
The vet's passkey stays on their phone; PawID keeps only its public key. HosPet.eu can revoke a vet:
venues then see a warning on that vet's confirmations. To delete a vet account, write to info@hospet.eu.

## Statements of support

On pawid.hospet.eu/support you can add your name to say you support PawID: name, role, country,
organisation and message (optional), email (optional). HosPet.eu checks each statement before it
counts. Your name, role, country, organisation and message are shown on that page only if you ticked
"Show my name"; otherwise you are only counted. HosPet.eu may share the numbers, and the public
statements, in applications for open source funding and in answers to EU consultations. The email is
never shown or shared; it is used only to write to you about PawID if you gave it. To remove your
statement, write to info@hospet.eu.

## Fact checks on the travel rules

On [pawid.hospet.eu/rules](https://pawid.hospet.eu/rules) anyone can confirm a rule or suggest a correction. A check holds the rule, your verdict, the source address, the words you copied from it, your suggested text if any, and your role. Name, organisation and email are optional.

- HosPet.eu reviews each check. Accepted checks show on the rule. Your name and organisation show only if you ticked the box; otherwise the check shows with your role only. Rejected checks are never shown.
- Your email is never shown or shared. We use it only to ask about your check, or to confirm that you work for a fact-checking organisation.
- Your network address is used for a few minutes to limit how many checks one address can send, and is not stored. The Cloudflare check that you are a person works as on the support form.
- The rules themselves change only in the files on GitHub, where every change is public.
- To have a check removed, write to info@hospet.eu.

## Stopping a code

In the app, a code you made can be stopped before it expires (on the pet's page, or right after you make
it). Your phone sends the code and a signature made with your key to the PawID API, which checks that the
code is yours and then keeps only a hash of the code's signature and its expiry date. Anyone who opens
or scans the code after that sees that you stopped it. The hash is deleted when the code would have
expired anyway.

## Digital credential

If a vet confirmed your pet, you can download the confirmation as a W3C Verifiable Credential, a file that
digital wallets and other apps can check. Your phone sends the confirmation (microchip, rabies vaccine
dates and vaccine, the vet's seal) to the PawID API, which checks the seal and that the vet is still
approved, signs the credential with PawID's key (published at pawid.hospet.eu/.well-known/did.json) and
sends it back. Nothing is stored. The credential does not contain your pet's name or anything you typed
yourself.

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
- **Cloudflare Turnstile** checks that the vet registration and the statement of support are sent by a
  person, not a bot. It runs only on those two forms, under the
  [Cloudflare Turnstile privacy addendum](https://www.cloudflare.com/turnstile-privacy-policy/).
- PawID uses no analytics service, no ads and no third party scripts, except Cloudflare Turnstile on the two forms above. Fonts and icons are served
  from PawID itself.

## Venues that use the PawID components

The components on a venue's site load from pawid.hospet.eu (sites that added them earlier load them from pawid.pages.dev) and talk to the PawID API. They set no
cookies. The scanner uses the camera only after staff press "Scan", and the picture never leaves the
device: only the code found in it is checked. The venue's own pet rules are the venue's, and the
venue's own privacy policy applies to its site.

## Moving from the old address

If you saved pets on pawid.pages.dev, opening it takes them along to pawid.hospet.eu in a restore
link (after the "#", never sent to a server). Nothing is restored until you tap Restore.

## Your rights

Your pets' details are only on your phone, so you can see, change and delete them in the app.
The counters cannot be linked to you.

Questions: open an issue on GitHub, or write to info@hospet.eu.

## Changes

When this page changes, the change is in this repository's history, with its date.

<img src="apps/web/public/brand/pawid-mark.svg" alt="" width="72" height="72">

# PawID

By <img src="apps/web/public/brand/hospet-mark.svg" alt="" width="18" height="18"> [HosPet.eu](https://hospet.eu)

Open source digital companion for the EU pet passport. Built for people who travel with dogs in Europe.

> PawID is NOT an official document. It does not replace the paper EU pet passport.
> The passport is issued by an official or authorised vet. PawID helps you keep track
> of it, remember expiry dates and show the essentials to pet friendly places.

## What it does (goal)

- Store your dog's passport data (microchip, vaccines, expiry dates), on your device first
- Vet confirmation: the owner gives the vet a 6 digit code (in person or by phone), both phones show the same number to check (like GitHub's number matching), and a registered vet confirms the microchip and rabies vaccine with a passkey (fingerprint or face) on their own phone; venues then see "confirmed by a vet" with the vet's name and register number. Vets need no app or software: pawid.hospet.eu/vet
- Put the rabies vaccine expiry in your phone's calendar, with alarms 30, 7 and 1 day before (made on the device, no email)
- Back up your pets by email to yourself: one link puts everything back on any phone
- Tell you what you need for each European country (rules are open data, with official sources)
- "Can I travel?": checks your pet against a country's rules on your travel date (microchip, rabies vaccine and the 21 day wait, tapeworm treatment window, breed rules)
- Show a QR code to hotels and venues: they see only the essentials, signed, no account needed
- Work offline

## Status

Early scaffold. Nothing here is production ready.

| Part | Status |
| --- | --- |
| `packages/core` schema, expiry logic, signed share token | started |
| `rules/` EU base rules + Italy, France, Spain, Germany, Ireland (checked 2026-11-21; open points marked `needs_review`) | in use |
| `apps/api` Cloudflare Worker + D1 | started |
| `apps/web` PWA (dog profile, rabies status, QR) | started |
| Vet signing module | not started |
| Passport photo extraction | not started |

## Structure

```
packages/core   shared logic, no UI, runs in Node and Workers
packages/ui     design tokens, components and the pet card (HosPet.eu design system)
packages/rules  rules/*.yaml as typed data, with a check that every source is official
packages/widgets Web Components for venues, built to /embed/v1.js
rules/          country requirements as YAML, each with source URL and last check date
apps/api        Cloudflare Worker (Hono) + D1
apps/web        PWA (next)
docs/           spec and decisions
```

## Principles

1. Do not invent the format: follow the official model passport and the EU Digital Identity Wallet formats.
2. The vet is the issuer. PawID never creates health data by itself.
3. Data stays on the device by default. Cloud sync is optional.
4. Every rule has an official source and a date. Unverified rules are marked `needs_review`.

## For venues

Four components for hotels, restaurants, bars, museums and places to visit. One script tag, no account:

```html
<script type="module" src="https://pawid.hospet.eu/embed/v1.js"></script>
<pawid-scanner></pawid-scanner>            <!-- staff check a guest's PawID with the camera -->
<pawid-policy with-button>…</pawid-policy> <!-- the venue's own pet rules -->
<pawid-button venue="Hotel X"></pawid-button>
<pawid-travel-check country="IT"></pawid-travel-check>
```

Live demos and the code to copy: https://pawid.hospet.eu/venues

## Connect: API and MCP

Read-only, no key, about 120 requests a minute per IP. Base URL: `https://pawid-api.hospet.workers.dev`.

| | |
| --- | --- |
| `GET /v1/verify?token=` | Check a PawID code: genuine, unchanged, not expired. Declared by the owner, never verified by a vet. |
| `GET /v1/rules?country=IT` | EU base rules plus a country's differences, each with status, official sources and last check date. |
| `GET /v1/countries` | Countries with their own rules file. |
| `GET /v1/keys` | PawID's public keys for vet confirmation seals. |
| `GET /v1/vets/:id` | Public record of an approved vet (name, register, number, country). |
| `GET /v1/openapi.json` | OpenAPI 3.1 spec. |
| `POST /mcp` | MCP server (Streamable HTTP). Tools: `verify_pet_card`, `get_pet_travel_rules`, `list_rule_countries`. |

For AI agents: [`skills/pawid/SKILL.md`](skills/pawid/SKILL.md).

Usage is counted per day without personal data: a metric, a coarse label (country code, site host name or client app name) and a number. No IP addresses, no tokens, no pet data.

## Develop

```
npm install
npm test
npm run typecheck
```

## License

Apache-2.0 for code. Rules data: CC BY 4.0 (see `rules/README.md`).

## Privacy

Your pets' details stay on your phone. See [PRIVACY.md](PRIVACY.md) for what the app, the API and the venue components do with data.

## Logos

The PawID mark is a paw inside a scan frame, with a check on the pad. The files are made from
`packages/ui/src/brand.ts` with `npm run brand -w @pawid/ui` (SVG in `apps/web/public/brand`,
favicon and app icons in `apps/web/public/icons`).

The HosPet.eu name and logo belong to HosPet.eu. They are not covered by the Apache-2.0 licence
of this code. If you run your own copy of PawID, remove the HosPet mark and the "by HosPet.eu" line.

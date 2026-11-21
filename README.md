# PawID

Open source digital companion for the EU pet passport. Built for people who travel with dogs in Europe.

> PawID is NOT an official document. It does not replace the paper EU pet passport.
> The passport is issued by an official or authorised vet. PawID helps you keep track
> of it, remember expiry dates and show the essentials to pet friendly places.

## What it does (goal)

- Store your dog's passport data (microchip, vaccines, expiry dates), on your device first
- Remind you before the rabies vaccine and other treatments expire
- Tell you what you need for each European country (rules are open data, with official sources)
- Show a QR code to hotels and venues: they see only the essentials, signed, no account needed
- Work offline

## Status

Early scaffold. Nothing here is production ready.

| Part | Status |
| --- | --- |
| `packages/core` schema, expiry logic, signed share token | started |
| `rules/` EU base rules + per-country overrides | started, needs review |
| `apps/api` Cloudflare Worker + D1 | started |
| `apps/web` PWA (dog profile, rabies status, QR) | started |
| Vet signing module | not started |
| Passport photo extraction | not started |

## Structure

```
packages/core   shared logic, no UI, runs in Node and Workers
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

## Develop

```
npm install
npm test
npm run typecheck
```

## License

Apache-2.0 for code. Rules data: CC BY 4.0 (see `rules/README.md`).

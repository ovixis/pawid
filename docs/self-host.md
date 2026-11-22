# Run your own PawID

PawID is Apache 2.0. A city, a national registry, a vet association or anyone else can run their own
copy, with their own servers, their own key and their own list of approved vets. This page explains
how, and how copies recognise each other's vet confirmations.

You need: a Cloudflare account (the free plan is enough for a pilot), Node.js 20 or newer, git.

## 1. Get the code

```sh
git clone https://github.com/ovixis/pawid.git && cd pawid
npm ci
npm test
```

## 2. The API (Cloudflare Worker and D1 database)

```sh
cd apps/api
npx wrangler login
npx wrangler d1 create pawid            # copy the database_id it prints
```

Edit `apps/api/wrangler.toml`:

| Setting | What to put |
|---|---|
| `name` | Your Worker's name, for example `pawid-api-yourcity` |
| `database_id` | The id from `d1 create` |
| `routes` | Remove it, or point `/v/*` of your own domain to the Worker |
| `VET_RP_ID` | The domain of your site, for example `pawid.example.org` (vets' passkeys are tied to it) |
| `VET_ORIGINS` | `https://pawid.example.org` |
| `TURNSTILE_HOSTNAMES` | Your site's host name, if you use Cloudflare Turnstile |
| `VET_SIGNING_KID` | Your key id from step 3, for example `ex1` |

Then:

```sh
npx wrangler d1 migrations apply pawid --remote
```

## 3. Your confirmation key

Vet confirmations are sealed with a key of your own.

```sh
npx vite-node scripts/new-confirm-key.ts
```

- Put the **private key** in the Worker: `npx wrangler secret put VET_SIGNING_KEY`. Keep an offline copy
  (a password manager). Never commit it.
- Add the **public key** to `CONFIRM_ISSUERS` in `packages/core/src/vetconfirm.ts`, with a key id nobody
  else uses, your API address, your did:web and a contact:

  ```ts
  ex1: { x: "<public key>", api: "https://pawid-api.example.org", did: "did:web:pawid.example.org", name: "PawID Example City", contact: "pets@example.org" },
  ```

- Write your DID document: `npx vite-node scripts/did-document.ts did:web:pawid.example.org`. It is
  served at `https://pawid.example.org/.well-known/did.json` and lets wallets check the credentials
  your copy issues.

Optional secrets:

```sh
npx wrangler secret put STATS_KEY          # admin: approve vets, read usage
npx wrangler secret put TURNSTILE_SECRET   # Cloudflare Turnstile on the vet and support forms
```

Deploy: `npx wrangler deploy`.

## 4. The site (Cloudflare Pages)

```sh
cd ../..
VITE_API=https://pawid-api.example.org \
VITE_VERIFY_BASE=https://pawid-api.example.org \
VITE_TURNSTILE_SITEKEY=<your site key> \
npm run build:site
npx wrangler pages deploy apps/web/dist --project-name pawid-example
```

`VITE_VERIFY_BASE` is where the QR codes point. The verify page is served by the Worker at `/v/…`, so
use the API address, or your site's domain if you routed `/v/*` to the Worker in step 2.

Things that still say HosPet.eu: the "by HosPet.eu" mark and footer (`apps/web/src/dom.ts`), the old
address redirect (`apps/web/src/move.ts`, does nothing on other domains), the MCP server's website
(`apps/api/src/mcp.ts`), the venue components' default addresses (`packages/widgets/src/base.ts`;
venues can also set `api="…"` on each component). Change or remove them: the HosPet mark is not
covered by the licence.

## 5. Approving vets

Vets register on your site's `/vet` page. You check each one against the national professional
register, then approve them:

```sh
curl -H "Authorization: Bearer $STATS_KEY" https://pawid-api.example.org/v1/admin/vets
curl -X POST -H "Authorization: Bearer $STATS_KEY" https://pawid-api.example.org/v1/admin/vets/<id>/approve
```

`revoke` instead of `approve` withdraws a vet: their confirmations stop showing as confirmed everywhere.

## Being recognised by other copies

What works between copies today:

| | Works across copies? |
|---|---|
| Codes the owner shows (QR and links) | Yes. They are signed by the owner's phone; any copy can check them. |
| Vet confirmations inside a code | Yes, if your key is in `CONFIRM_ISSUERS`. A copy that sees your key id asks your API (`/v1/vets/<id>`) whether the vet is still approved, and caches the answer for an hour. |
| Stopping a code before it expires | No. A stopped code is known only to the copy that was told. Owners stop codes on the copy their app uses. |
| W3C credentials | Yes. Anyone can check them against your did:web. Only the copy that sealed a confirmation issues its credential. |

To be recognised by pawid.hospet.eu and every copy that updates from this repository, open a pull
request that adds your entry to `CONFIRM_ISSUERS`, with:

1. who runs the copy, and a contact;
2. how you check vets (which professional register, who does it);
3. your API address answering `/v1/keys` and `/v1/vets/<id>`, and your DID document online.

Entries are reviewed in public. An issuer that stops checking vets, or loses its key, is removed the
same way, and its confirmations then show as not confirmed.

## Keeping up to date

Pull from this repository, run `npm test`, apply new migrations
(`npx wrangler d1 migrations apply pawid --remote`), deploy the Worker, build and deploy the site.

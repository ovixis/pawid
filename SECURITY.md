# Security

PawID handles pet details, signed codes and vet confirmations, so security reports matter to us.

## Report a problem privately

Use GitHub's private report: https://github.com/ovixis/pawid/security/advisories/new
or write to info@hospet.eu with "PawID security" in the subject.

Please do not open a public issue, and do not test against real people's data. We answer within a few
working days, tell you what we will do, and credit you in the fix if you want.

## What is in scope

- The app at pawid.hospet.eu, the vet page (/vet), the venue components (/embed/v1.js)
- The API at pawid-api.hospet.workers.dev and the verify page (/v/...)
- The signing and confirmation code in `packages/core` (share tokens, vet seals, passkey checks, pairing)

## What we already know

- The owner's signing key is kept in the browser's localStorage. Moving it to a non-extractable key is planned.
- Data in a shared code is readable by anyone who has the code until it expires. That is by design: the owner chooses what goes in it.

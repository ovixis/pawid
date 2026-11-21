# Contributing to PawID

Thanks for helping. The most useful contribution is correct country rules.

## Add or update a country

1. Copy `rules/countries/_template.yaml` to `rules/countries/<iso2>.yaml` (lower case, for example `it.yaml`).
2. Write only what differs from `rules/eu-base.yaml`. Leave out anything that is the same.
3. Every rule needs at least one official source URL in `sources`.
4. Set `last_checked` to the date you read the source (YYYY-MM-DD) and `checked_by` to your GitHub handle.
5. Use `status: verified` only if the source says it clearly. Otherwise use `status: needs_review` and add a `todo` that says what is missing.
6. Never guess a number (days, months, number of animals). If the source does not give it, leave it out and mark `needs_review`.
7. Do not change the meaning of an existing `needs_review` rule without citing a source.

## What counts as an official source

Accepted:

- European Commission pages (food.ec.europa.eu, europa.eu/youreurope, commission.europa.eu)
- EUR-Lex (the text of the regulation)
- A national ministry, veterinary authority or customs authority of the country concerned
- The country's page listed by the Commission at https://food.ec.europa.eu/animals/movement-pets_en

Not accepted: blogs, travel agencies, airlines, forums, AI answers, hotel sites. They can point you to an official page, but the official page is what you cite.

## Found a wrong rule?

Open an issue with the "Rule correction" template and link the official page.

## Code

```
npm install
npm run typecheck
npm test
```

Keep dog data on the device. Escape all user data in HTML. Do not loosen the Content Security Policy of the verify page.

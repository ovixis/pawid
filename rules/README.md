# Rules data

Pet travel requirements as open data.

- `eu-base.yaml`: rules that apply across the EU.
- `countries/<iso2>.yaml`: only the differences for one country. Start from `_template.yaml`.
- `vaccines.yaml`: typical vaccination schedules for dogs and cats, and the vaccines required by law in each country (and Spanish region). European sources only. Every age has a source and a quote; if a source is unclear, the item has `status: needs_review` and PawID shows no date.

## How to contribute

1. Pick a country.
2. Find the official national page (the European Commission lists the national pages: https://food.ec.europa.eu/animals/movement-pets_en).
3. Copy `_template.yaml`, write only what differs from the EU base.
4. Every rule needs an official source URL and `last_checked`.
5. If you are not sure, set `status: needs_review`. Never guess.

## Disclaimer

This is not legal advice and not official. Rules change. Always check the official source
before travelling. PawID shows the `last_checked` date next to every rule.

## License

CC BY 4.0. Cite "PawID rules" and link back to the repository.

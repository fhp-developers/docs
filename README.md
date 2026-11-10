# Kalixo Developer Docs

Mintlify-powered developer documentation for two Kalixo products, with a product switcher at
the top of the sidebar:

- **Distribution API** (v2): catalog, ordering and wallet. Pages live at the root of this repo.
- **Checkout**: payments with Kalixo as merchant of record. Pages live under `checkout/`.

Modern theme, Kalixo branding, and an interactive **“Try it”** API playground driven by
each product's OpenAPI spec.

## Stack

- **[Mintlify](https://mintlify.com)** - docs framework + hosting + API playground.
- `docs.json` - site config (theme, colors, product switcher and navigation, API playground).
- `openapi.json` - Distribution API OpenAPI 3.1 spec that generates its API reference and playground.
- `checkout/openapi.yaml` - Checkout OpenAPI spec, synced from the `kalixo-checkout` repo (see below).
- MDX pages - guides and core-concept pages.

## Local development

Install the Mint CLI and run the dev server from this folder:

```bash
npm i -g mint
mint dev
```

The site opens at `http://localhost:3000`. Edits to `.mdx`, `docs.json`, and `openapi.json`
hot-reload.

### Validate

```bash
mint validate        # validate docs.json + OpenAPI
```

## Branding

- Palette: lime greens from `#f4fdd8` (50) through `#0a0c03` (950); primary accent `#c9f73a` (500).
  All three `colors` in `docs.json` use `#c9f73a`, the same lime as kalixo.io.
- Buttons are lime with `#0a0c03` text in both modes (`custom.css` overrides Mintlify's white labels).
- Light mode: white background; lime for highlights, underlines and the current page, with
  `#0a0c03` for accent text and icons, because lime text on white is unreadable.
- Dark mode background: `#0a0c03`. Dark mode is the default.
- Logo: `logo/kalixo-white.svg` (dark mode) and `logo/kalixo-black.svg` (light mode).
- Favicon: `favicon.ico` (from [kalixo.io](https://kalixo.io/favicon.ico)).

Edit colors, logo, navigation, and the playground in `docs.json`.

## Postman

Import into Postman:

1. **Collection:** [`kalixo-api-v2.postman_collection.json`](./kalixo-api-v2.postman_collection.json)
2. **Environment:** [Sandbox](./kalixo-api-v2.postman_environment.sandbox.json) or
   [Production](./kalixo-api-v2.postman_environment.production.json) - set the `apiKey` variable.
3. For local dev (catalog on `:3002`, orders on `:3003`): use
   [`kalixo-api-v2.postman_environment.local.json`](./kalixo-api-v2.postman_environment.local.json).

Regenerate the collection after OpenAPI changes:

```bash
npm run postman:generate
```

## Structure

```
docs.json                 # site config + navigation + theme
openapi.json              # API spec (powers the reference + Try it)
kalixo-api-v2.postman_collection.json
kalixo-api-v2.postman_environment.*.json
favicon.ico
custom.css
logo/                     # light/dark wordmarks
index.mdx                 # introduction (landing)
quickstart.mdx
authentication.mdx
concepts/                 # pagination, filtering, open-denomination,
                          # order-lifecycle, idempotency, rate-limits,
                          # errors, notifications
migrating-from-v1.mdx
api-reference/introduction.mdx
checkout/                 # Kalixo Checkout: every page and its openapi.yaml
```

## Editing the API reference

The Distribution API reference is generated from `openapi.json`. To add or change an endpoint,
edit the spec - the reference pages and the interactive playground update automatically. Use
`x-default` on the `apiKey` security scheme to pre-fill a placeholder key in the playground.

The Checkout API reference is generated from `checkout/openapi.yaml`. Don't edit that file here:
change `openapi/kalixo-checkout.v1.yaml` in the `kalixo-checkout` repo, then copy it over with
the repo checked out next to this one:

```bash
npm run sync-checkout-openapi
```

Links in Checkout pages must start with `/checkout/`; without the prefix they open a
Distribution API page.

## Deployment

Connect this repo to Mintlify (recommended) for hosting on the Kalixo docs domain, or
self-host the built output. The “Download API spec” menu option lets integrators import the
spec into Postman/Insomnia, or use the bundled Postman collection (see above).

> Base URLs in `openapi.json` (`api.kalixo.io`, `sandbox.kalixo.io`) are pre-release
> placeholders - update them once the final domains are confirmed.

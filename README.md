# Kalixo API v2 - Developer Docs

Mintlify-powered developer documentation for the Kalixo Distribution API v2.
Modern theme, Kalixo branding, and an interactive **“Try it”** API playground driven by
the bundled OpenAPI spec.

## Stack

- **[Mintlify](https://mintlify.com)** - docs framework + hosting + API playground.
- `docs.json` - site config (theme, colors, navigation, API playground).
- `openapi.json` - OpenAPI 3.1 spec that generates the API reference and the live playground.
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

- Primary: `#c9f73a` (neon green) on `#0a0a0a` (near-black). Dark mode is the default.
- Logo: `logo/kalixo-white.svg` (dark mode) and `logo/kalixo-black.svg` (light mode).
- Favicon: `favicon.svg` (green “k” monogram on black).

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
favicon.svg
logo/                     # light/dark wordmarks
index.mdx                 # introduction (landing)
quickstart.mdx
authentication.mdx
concepts/                 # pagination, filtering, open-denomination,
                          # order-lifecycle, idempotency, rate-limits,
                          # errors, notifications
migrating-from-v1.mdx
api-reference/introduction.mdx
```

## Editing the API reference

The API reference is generated from `openapi.json`. To add or change an endpoint, edit the
spec - the reference pages and the interactive playground update automatically. Use
`x-default` on the `apiKey` security scheme to pre-fill a placeholder key in the playground.

## Deployment

Connect this repo to Mintlify (recommended) for hosting on the Kalixo docs domain, or
self-host the built output. The “Download API spec” menu option lets integrators import the
spec into Postman/Insomnia, or use the bundled Postman collection (see above).

> Base URLs in `openapi.json` (`api.kalixo.io`, `sandbox.kalixo.io`) are pre-release
> placeholders - update them once the final domains are confirmed.

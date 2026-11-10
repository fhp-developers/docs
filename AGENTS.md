# Documentation project instructions

## About this project

- Kalixo's developer documentation on `developer.kalixo.io`, built on [Mintlify](https://mintlify.com).
- Pages are MDX files with YAML frontmatter; configuration lives in `docs.json`.
- The site holds two products. Readers pick one with the product switcher (`navigation.products` in `docs.json`):
  - **Distribution API**: the pages at the root (`index.mdx`, `quickstart.mdx`, `concepts/`, ...).
    The API reference is generated from `openapi.json`, which is edited in this repository.
  - **Checkout**: everything under `checkout/`. The API reference is generated from
    `checkout/openapi.yaml`, copied from the `kalixo-checkout` repository
    (`openapi/kalixo-checkout.v1.yaml`) with `npm run sync-checkout-openapi`. Never edit
    `checkout/openapi.yaml` here; change the source and sync.
- Links in Checkout pages start with `/checkout/`. A link without that prefix opens a Distribution API page.
- Use the Mintlify MCP server, `https://mcp.mintlify.com`, to edit content and settings via MCP.
- Use the Mintlify docs MCP server, `https://www.mintlify.com/docs/mcp`, for Mintlify questions.

## Style preferences (both products)

- Use active voice and second person ("you").
- Keep sentences concise: one idea per sentence.
- Use sentence case for headings.
- Bold for UI elements: Click **Settings**.
- Code formatting for file names, commands, paths, field names, event types and code references.

## Checkout (`checkout/`)

### Terminology

- "Partner", not "merchant" or "client": the company integrating Kalixo Checkout.
- "Shopper", not "customer", for the person paying. `customer` is the API object for stored payment methods.
- "Kalixo is merchant of record": partners never contract with a payment provider.
- "Payment provider" for payment service providers. Never name a payment service provider
  anywhere in the docs or the API spec: not in text, examples, domains, test cards or code.
- "Checkout session", "payment", "attempt" (internal only, do not document attempts as a partner object).
- Amounts are "integers in the minor unit" (EUR 49.99 is `4999`).

### Style

- Every money example shows the currency and states that amounts are in minor units.

### Content boundaries

- Do not document internal endpoints (`/ops/*`, backoffice), incoming provider webhooks
  (`/webhooks/*`), routing rules or provider accounts.
- Do not document the `provider_payload` field beyond "opaque, for Kalixo.js only".
- Do not promise payment methods per country; partners ask Kalixo integrations.

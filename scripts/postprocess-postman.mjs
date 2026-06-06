/**
 * Tweaks the OpenAPI-generated Postman collection for Kalixo v2.
 * Run after: npx openapi-to-postmanv2 -s openapi.json -o kalixo-api-v2.postman_collection.json -p
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "kalixo-api-v2.postman_collection.json");
const collection = JSON.parse(readFileSync(path, "utf8"));

collection.info.name = "Kalixo API v2";
collection.info.description = {
  content: [
    "Kalixo Distribution API v2 - catalog, async orders, and wallet.",
    "",
    "Setup:",
    "1. Import this collection and an environment file from the docs repo.",
    "2. Set `apiKey` to your sandbox or production key.",
    "3. Select the **Sandbox** or **Production** environment.",
    "",
    "Auth: collection uses `x-api-key` → `{{apiKey}}`.",
    "Regenerate from `openapi.json` with `npm run postman:generate`.",
    "",
    "Contact: integrations@kalixo.io",
  ].join("\n"),
  type: "text/plain",
};

collection.variable = [
  { key: "baseUrl", value: "https://sandbox.kalixo.io/v2" },
  { key: "apiKey", value: "" },
  { key: "productId", value: "2" },
  { key: "orderReference", value: "O-12345" },
  { key: "externalOrderCode", value: "O-12345" },
  { key: "linePrice", value: "10000" },
  { key: "currency", value: "GBP" },
];

const placeOrderBody = `{
  "externalOrderCode": "{{externalOrderCode}}",
  "currency": "{{currency}}",
  "price": {{linePrice}},
  "orderProducts": [
    {
      "productId": {{productId}},
      "price": {{linePrice}},
      "quantity": 1
    }
  ]
}`;

function walkItems(items) {
  for (const item of items) {
    if (item.item) {
      walkItems(item.item);
      continue;
    }
    const req = item.request;
    if (!req) continue;

    if (item.name === "List catalog products" && req.url?.query) {
      for (const q of req.url.query) {
        if (q.key === "country") {
          q.value = "GB";
          q.disabled = false;
        } else if (
          ["language", "brand", "category", "tag", "search"].includes(q.key)
        ) {
          q.disabled = true;
        }
      }
    }

    if (item.name === "Get a single product" && req.url?.variable) {
      const v = req.url.variable.find((x) => x.key === "productId");
      if (v) v.value = "{{productId}}";
    }

    if (item.name === "Place an order" && req.body?.mode === "raw") {
      req.body.raw = placeOrderBody;
    }

    if (item.name === "Retrieve an order" && req.url?.variable) {
      const v = req.url.variable.find((x) => x.key === "reference");
      if (v) v.value = "{{orderReference}}";
    }

    const firstPath = req.url?.path?.[0];
    if (firstPath === "orders" || firstPath === "wallet") {
      req.url.host = ["{{ordersBaseUrl}}"];
    }
  }
}

collection.variable.push({
  key: "ordersBaseUrl",
  value: "https://sandbox.kalixo.io/v2",
});

walkItems(collection.item);

writeFileSync(path, JSON.stringify(collection, null, 4) + "\n");
console.log("Postman collection post-processed:", path);

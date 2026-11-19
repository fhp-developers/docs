/**
 * Kalixo Distribution API v2 - reference Node client (Node 18+, ES modules).
 * Copy into your project or adapt as needed. Not published to npm.
 */

const DEFAULT_POLL_MS = 60_000;
const DEFAULT_MAX_WAIT_MS = 2 * 60 * 60_000;
const MAX_RETRIES = 5;

/**
 * @typedef {object} KalixoClientOptions
 * @property {string} apiKey
 * @property {string} [baseUrl]
 * @property {number} [pollIntervalMs] Delay between polls after `estimatedReadyAt` (default 60s).
 * @property {number} [maxWaitMs] Give up polling an order after this long (default 2 hours).
 */

/**
 * @typedef {object} OrderLine
 * @property {string} productCode
 * @property {number} quantity
 * @property {number} [price] Unit price in minor units. Required for open-denomination products.
 * @property {string} [country] The catalog row's `countryCode`. Required when the product has several `availableCountries`.
 * @property {string} [sku] Market SKU; its country prefix is used when `country` is omitted.
 * @property {string} [currency]
 */

export class KalixoError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string | null} requestId
   */
  constructor(message, statusCode, requestId) {
    super(message);
    this.name = 'KalixoError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

export class KalixoClient {
  /** @param {KalixoClientOptions} options */
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.kalixo.io/v2').replace(/\/$/, '');
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
    this.maxWaitMs = options.maxWaitMs ?? DEFAULT_MAX_WAIT_MS;
  }

  /** @param {string} apiKey @param {Partial<KalixoClientOptions>} [options] */
  static sandbox(apiKey, options = {}) {
    return new KalixoClient({ ...options, apiKey, baseUrl: 'https://sandbox.kalixo.io/v2' });
  }

  /** @param {string} apiKey @param {Partial<KalixoClientOptions>} [options] */
  static production(apiKey, options = {}) {
    return new KalixoClient({ ...options, apiKey, baseUrl: 'https://api.kalixo.io/v2' });
  }

  /**
   * Retries 429 (after Retry-After), 5xx and network errors. Retrying POST /orders is safe:
   * the externalOrderCode makes Kalixo return the existing order instead of a new one.
   */
  async request(path, init = {}, attempt = 0) {
    let res;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });
    } catch (networkError) {
      if (attempt >= MAX_RETRIES) throw networkError;
      await sleep(backoff(attempt));
      return this.request(path, init, attempt + 1);
    }

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(Number(res.headers.get('Retry-After') ?? '60') * 1000);
      return this.request(path, init, attempt + 1);
    }
    if (res.status >= 500 && attempt < MAX_RETRIES) {
      await sleep(backoff(attempt));
      return this.request(path, init, attempt + 1);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new KalixoError(body.message ?? `HTTP ${res.status}`, body.statusCode ?? res.status, res.headers.get('X-Request-Id'));
    }
    return body;
  }

  /** @param {Record<string, string | number>} [params] country, language, brand, category, tag, search, skip, take */
  listProducts(params = {}) {
    const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return this.request(`/catalog/products${query ? `?${query}` : ''}`);
  }

  /** @param {string} productCode @param {string} [country] Market row for a regional product. */
  getProduct(productCode, country) {
    const query = country ? `?country=${encodeURIComponent(country)}` : '';
    return this.request(`/catalog/products/${encodeURIComponent(productCode)}${query}`);
  }

  /**
   * @param {{ externalOrderCode: string, currency: string, price?: number, orderProducts: OrderLine[] }} payload
   */
  placeOrder(payload) {
    return this.request('/orders', { method: 'POST', body: JSON.stringify(payload) });
  }

  /** Fetch an order by its UUID orderId or your externalOrderCode. */
  getOrder(reference) {
    return this.request(`/orders/${encodeURIComponent(reference)}`);
  }

  getWallet() {
    return this.request('/wallet');
  }

  /** Sandbox only: Kalixo Test products with expected outcomes and sample order lines. */
  listSandboxScenarios() {
    return this.request('/sandbox/scenarios');
  }

  /** Wait until estimatedReadyAt, then poll until completed, partially_completed or failed. */
  async waitForOrder(reference, estimatedReadyAt) {
    const deadline = Date.now() + this.maxWaitMs;
    if (estimatedReadyAt) await sleep(Math.max(0, new Date(estimatedReadyAt).getTime() - Date.now()));
    for (;;) {
      const order = await this.getOrder(reference);
      if (order.status !== 'processing') return order;
      if (Date.now() >= deadline) {
        throw new Error(`Order ${reference} is still processing after ${Math.round(this.maxWaitMs / 60_000)} minutes; contact integrations@kalixo.io`);
      }
      await sleep(this.pollIntervalMs);
    }
  }

  /** Place an order and wait for a terminal status. */
  async placeOrderAndWait(payload) {
    const accepted = await this.placeOrder(payload);
    return this.waitForOrder(accepted.orderId, accepted.estimatedReadyAt);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoff(attempt) {
  return Math.min(2 ** attempt * 1000, 30_000);
}

/** Generate a unique external order code before calling placeOrder, and reuse it on retries. */
export function newExternalOrderCode(prefix = 'O') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Kalixo Distribution API v2 - reference Node client.
 * Copy into your project or adapt as needed. Not published to npm.
 */

const DEFAULT_POLL_MS = 60_000;

export type KalixoClientOptions = {
  apiKey: string;
  baseUrl?: string;
  pollIntervalMs?: number;
};

export class KalixoClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;

  constructor(options: KalixoClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? 'https://api.kalixo.io/v2').replace(/\/$/, '');
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_MS;
  }

  static sandbox(apiKey: string, pollIntervalMs?: number) {
    return new KalixoClient({
      apiKey,
      baseUrl: 'https://sandbox.kalixo.io/v2',
      pollIntervalMs,
    });
  }

  static production(apiKey: string, pollIntervalMs?: number) {
    return new KalixoClient({
      apiKey,
      baseUrl: 'https://api.kalixo.io/v2',
      pollIntervalMs,
    });
  }

  private async request(path: string, init: RequestInit = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? '60');
      await sleep(retryAfter * 1000);
      return this.request(path, init);
    }

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.message ?? `HTTP ${res.status}`);
      (err as any).statusCode = body.statusCode ?? res.status;
      throw err;
    }
    return body;
  }

  listProducts(params: Record<string, string | number> = {}) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    );
    const q = qs.toString();
    return this.request(`/catalog/products${q ? `?${q}` : ''}`);
  }

  getProduct(productId: number) {
    return this.request(`/catalog/products/${productId}`);
  }

  placeOrder(payload: {
    externalOrderCode: string;
    currency: string;
    price?: number;
    orderProducts: Array<{
      productId: number;
      price?: number;
      quantity: number;
      currency?: string;
    }>;
  }) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getOrder(reference: string | number) {
    return this.request(`/orders/${reference}`);
  }

  getWallet() {
    return this.request('/wallet');
  }

  /** Wait until estimatedReadyAt, then poll until a terminal status. */
  async waitForOrder(
    reference: string | number,
    estimatedReadyAt?: string,
  ) {
    if (estimatedReadyAt) {
      await waitUntil(estimatedReadyAt);
    }
    for (;;) {
      const order = await this.getOrder(reference);
      if (order.status !== 'processing') return order;
      await sleep(this.pollIntervalMs);
    }
  }

  /** Place an order and block until codes are delivered or a terminal failure. */
  async placeOrderAndWait(
    payload: Parameters<KalixoClient['placeOrder']>[0],
  ) {
    const accepted = await this.placeOrder(payload);
    return this.waitForOrder(accepted.orderId, accepted.estimatedReadyAt);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function waitUntil(iso: string) {
  const ms = Math.max(0, new Date(iso).getTime() - Date.now());
  return sleep(ms);
}

/** Generate a unique external order code before calling placeOrder. */
export function newExternalOrderCode(prefix = 'O') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

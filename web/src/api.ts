export type Settings = { baseUrl: string; token: string };

export type ReceiptSummary = {
  id: number;
  accessKey: string;
  storeName: string;
  issuedAt: string;
  itemCount: number;
  paidCents: number;
};
export type ProductStats = {
  id: number;
  name: string;
  unit: string;
  purchases: number;
  minCents: number;
  maxCents: number;
  firstCents: number;
  lastCents: number;
  lastSeen: string;
};
export type PricePoint = {
  itemId: number;
  issuedAt: string;
  unitPriceCents: number;
  qty: number;
  unit: string;
  storeName: string;
};
export type ProductDetail = {
  id: number;
  name: string;
  unit: string;
  aliases: { description: string; storeCode: string; storeName: string }[];
  points: PricePoint[];
};
export type Suggestion = { id: number; a: number; b: number; nameA: string; nameB: string; reason: string };
export type ProductSort = "recent" | "variation" | "name";

const KEY = "preco-vivo:settings";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Settings;
  } catch {
    // storage blocked: fall through to same-origin defaults
  }
  return { baseUrl: "", token: "" };
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify({ baseUrl: s.baseUrl.trim().replace(/\/$/, ""), token: s.token.trim() }));
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { baseUrl, token } = loadSettings();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Servidor inacessível. Confira o endereço em Configurações.", 0);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new ApiError(data.error ?? `Erro HTTP ${res.status}`, res.status);
  return data as T;
}

const qs = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export const api = {
  importReceipt: (url: string) =>
    request<{ receipt: ReceiptSummary; created: boolean }>("POST", "/api/receipts", { url }),
  receipts: (offset: number) =>
    request<{ items: ReceiptSummary[] }>("GET", `/api/receipts?${qs({ limit: 30, offset })}`),
  products: (q: string, sort: ProductSort, offset: number) =>
    request<{ items: ProductStats[] }>("GET", `/api/products?${qs({ q, sort, limit: 30, offset })}`),
  product: (id: number) => request<ProductDetail>("GET", `/api/products/${id}`),
  rename: (id: number, name: string) => request<ProductDetail>("PATCH", `/api/products/${id}`, { name }),
  suggestions: () => request<{ items: Suggestion[] }>("GET", "/api/suggestions?limit=50"),
  refreshSuggestions: () => request<{ created: number }>("POST", "/api/suggestions/refresh"),
  acceptSuggestion: (id: number) => request<void>("POST", `/api/suggestions/${id}/accept`),
  dismissSuggestion: (id: number) => request<void>("POST", `/api/suggestions/${id}/dismiss`),
};

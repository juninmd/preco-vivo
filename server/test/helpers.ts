import { createApp } from "../src/app";
import { openDb } from "../src/db/migrate";
import type { Judge } from "../src/suggestions/judge";

export const TOKEN = "test-token-0123456789abcdef";

export function setup({ pages = new Map<string, string>(), judge = null as Judge | null } = {}) {
  const fetched: string[] = [];
  const db = openDb(":memory:");
  const app = createApp({
    db,
    judge,
    apiToken: TOKEN,
    corsOrigins: ["https://localhost"],
    fetchHtml: async (url) => {
      fetched.push(url);
      await Bun.sleep(1);
      const key = new URL(url).searchParams.get("p")?.split("|")[0] ?? "";
      return pages.get(key) ?? "<html><body>Chave de Acesso do QR Code inválido</body></html>";
    },
  });
  const call = async (method: string, path: string, body?: unknown, token = TOKEN) => {
    const res = await app.request(path, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
  return { db, app, call, fetched, pages };
}

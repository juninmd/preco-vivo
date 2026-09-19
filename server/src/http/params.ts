import type { Context } from "hono";
import { UserError } from "../errors";

export function page(c: Context, maxLimit = 100) {
  const limit = Number(c.req.query("limit") ?? 30);
  const offset = Number(c.req.query("offset") ?? 0);
  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) throw new UserError(`limit deve ser 1..${maxLimit}.`);
  if (!Number.isInteger(offset) || offset < 0) throw new UserError("offset inválido.");
  return { limit, offset };
}

export function idParam(c: Context, name = "id"): number {
  const id = Number(c.req.param(name));
  if (!Number.isSafeInteger(id) || id < 1) throw new UserError("id inválido.");
  return id;
}

export async function jsonBody(c: Context): Promise<Record<string, unknown>> {
  const body: unknown = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new UserError("Corpo JSON inválido.");
  return body as Record<string, unknown>;
}

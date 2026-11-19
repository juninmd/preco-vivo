import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export function bearerAuth(token: string): MiddlewareHandler {
  const expected = Buffer.from(token);
  return async (c, next) => {
    const header = c.req.header("Authorization") ?? "";
    const given = Buffer.from(header.startsWith("Bearer ") ? header.slice(7) : "");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return c.json({ error: "Token inválido." }, 401);
    }
    await next();
  };
}

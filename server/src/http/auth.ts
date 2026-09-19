import { timingSafeEqual } from "node:crypto";
import type { MiddlewareHandler } from "hono";

export function bearerAuth(token: string): MiddlewareHandler {
  const expected = Buffer.from(token);
  return async (c, next) => {
    const given = Buffer.from((c.req.header("Authorization") ?? "").replace(/^Bearer /, ""));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return c.json({ error: "Token inválido." }, 401);
    }
    await next();
  };
}

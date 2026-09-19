import { Hono } from "hono";
import { UserError } from "../errors";
import { jsonBody, page } from "../http/params";
import type { createReceiptService } from "./service";

export function receiptRoutes(service: ReturnType<typeof createReceiptService>) {
  return new Hono()
    .get("/", (c) => {
      const { limit, offset } = page(c);
      return c.json({ items: service.list(limit, offset) });
    })
    .post("/", async (c) => {
      const { url } = await jsonBody(c);
      if (typeof url !== "string") throw new UserError("Campo url obrigatório.");
      const result = await service.importFromInput(url);
      return c.json(result, result.created ? 201 : 200);
    });
}

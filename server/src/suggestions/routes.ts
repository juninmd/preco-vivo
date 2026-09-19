import { Hono } from "hono";
import { idParam, page } from "../http/params";
import type { createSuggestionService } from "./service";

export function suggestionRoutes(service: ReturnType<typeof createSuggestionService>) {
  return new Hono()
    .get("/", (c) => {
      const { limit, offset } = page(c);
      return c.json({ items: service.list(limit, offset) });
    })
    .post("/refresh", async (c) => c.json(await service.refresh()))
    .post("/:id/accept", (c) => {
      service.accept(idParam(c));
      return c.body(null, 204);
    })
    .post("/:id/dismiss", (c) => {
      service.dismiss(idParam(c));
      return c.body(null, 204);
    });
}

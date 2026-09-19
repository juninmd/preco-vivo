import type { Database } from "bun:sqlite";
import { Hono } from "hono";
import { UserError } from "../errors";
import { idParam, jsonBody, page } from "../http/params";
import { createProductRepo, type ProductSort } from "./repo";

const SORTS: ProductSort[] = ["recent", "variation", "name"];

export function productRoutes(db: Database) {
  const repo = createProductRepo(db);
  return new Hono()
    .get("/", (c) => {
      const { limit, offset } = page(c);
      const sort = (c.req.query("sort") ?? "recent") as ProductSort;
      if (!SORTS.includes(sort)) throw new UserError(`sort deve ser ${SORTS.join("|")}.`);
      const q = c.req.query("q")?.trim().slice(0, 100) || undefined;
      return c.json({ items: repo.list(q, sort, limit, offset) });
    })
    .get("/:id", (c) => c.json(repo.detail(idParam(c))))
    .patch("/:id", async (c) => {
      const { name } = await jsonBody(c);
      if (typeof name !== "string" || !name.trim() || name.length > 120)
        throw new UserError("Nome deve ter 1..120 caracteres.");
      const id = idParam(c);
      repo.rename(id, name.trim());
      return c.json(repo.detail(id));
    })
    .post("/:id/merge", async (c) => {
      const { sourceIds } = await jsonBody(c);
      if (
        !Array.isArray(sourceIds) ||
        sourceIds.length === 0 ||
        sourceIds.length > 50 ||
        !sourceIds.every(Number.isSafeInteger)
      ) {
        throw new UserError("sourceIds deve ser uma lista de 1..50 ids.");
      }
      const id = idParam(c);
      repo.merge(id, sourceIds as number[]);
      return c.json(repo.detail(id));
    });
}

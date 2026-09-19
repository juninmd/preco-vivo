import type { Database } from "bun:sqlite";
import { UserError } from "../errors";

export type ProductSort = "recent" | "variation" | "name";

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

const ORDER: Record<ProductSort, string> = {
  recent: "lastSeen DESC, id DESC",
  variation: "(lastCents - firstCents) * 1.0 / firstCents DESC, id DESC",
  name: "name COLLATE NOCASE ASC, id ASC",
};

const STATS = (order: string) => `
  WITH pts AS (
    SELECT a.product_id, r.issued_at, i.unit_price_cents AS price,
      ROW_NUMBER() OVER (PARTITION BY a.product_id ORDER BY r.issued_at, i.id) AS rn_first,
      ROW_NUMBER() OVER (PARTITION BY a.product_id ORDER BY r.issued_at DESC, i.id DESC) AS rn_last
    FROM receipt_items i
    JOIN product_aliases a ON a.id = i.alias_id
    JOIN receipts r ON r.id = i.receipt_id
  )
  SELECT p.id, p.name, p.unit, COUNT(*) AS purchases, MIN(price) AS minCents, MAX(price) AS maxCents,
    MAX(CASE WHEN rn_first = 1 THEN price END) AS firstCents,
    MAX(CASE WHEN rn_last = 1 THEN price END) AS lastCents,
    MAX(issued_at) AS lastSeen
  FROM products p JOIN pts ON pts.product_id = p.id
  WHERE ?1 IS NULL OR p.name LIKE ?1 ESCAPE '\\'
     OR EXISTS (SELECT 1 FROM product_aliases x WHERE x.product_id = p.id AND x.description LIKE ?1 ESCAPE '\\')
  GROUP BY p.id
  ORDER BY ${order}
  LIMIT ?2 OFFSET ?3`;

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;

export function createProductRepo(db: Database) {
  const lists = Object.fromEntries(Object.entries(ORDER).map(([k, order]) => [k, db.query(STATS(order))])) as Record<
    ProductSort,
    ReturnType<Database["query"]>
  >;
  const one = db.query("SELECT id, name, unit FROM products WHERE id = ?");
  const series = db.query(
    `SELECT i.id AS itemId, r.issued_at AS issuedAt, i.unit_price_cents AS unitPriceCents, i.qty, i.unit, s.name AS storeName
     FROM receipt_items i
     JOIN product_aliases a ON a.id = i.alias_id
     JOIN receipts r ON r.id = i.receipt_id
     JOIN stores s ON s.id = r.store_id
     WHERE a.product_id = ? ORDER BY r.issued_at, i.id LIMIT 1000`,
  );
  const aliases = db.query(
    `SELECT a.description, a.store_code AS storeCode, s.name AS storeName
     FROM product_aliases a JOIN stores s ON s.id = a.store_id WHERE a.product_id = ? ORDER BY a.id`,
  );
  const rename = db.query("UPDATE products SET name = ? WHERE id = ?");
  const moveAliases = db.query("UPDATE product_aliases SET product_id = ? WHERE product_id = ?");
  const remove = db.query("DELETE FROM products WHERE id = ?");

  const get = (id: number) => {
    const p = one.get(id) as { id: number; name: string; unit: string } | null;
    if (!p) throw new UserError(`Produto ${id} não existe.`, 404);
    return p;
  };

  const merge = db.transaction((targetId: number, sourceIds: number[]) => {
    get(targetId);
    for (const id of sourceIds) {
      if (id === targetId) throw new UserError("Um produto não pode ser mesclado nele mesmo.");
      get(id);
      moveAliases.run(targetId, id);
      remove.run(id);
    }
  });

  return {
    list: (q: string | undefined, sort: ProductSort, limit: number, offset: number) =>
      lists[sort].all(q ? likePattern(q) : null, limit, offset) as ProductStats[],
    detail: (id: number) => ({
      ...get(id),
      aliases: aliases.all(id) as { description: string; storeCode: string; storeName: string }[],
      points: series.all(id) as PricePoint[],
    }),
    rename: (id: number, name: string) => {
      get(id);
      rename.run(name, id);
    },
    merge: (targetId: number, sourceIds: number[]) => merge(targetId, [...new Set(sourceIds)]),
  };
}

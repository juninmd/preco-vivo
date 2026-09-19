import type { Database } from "bun:sqlite";
import type { ParsedItem, ParsedReceipt } from "../nfce/parse";

export type ReceiptSummary = {
  id: number;
  accessKey: string;
  storeName: string;
  issuedAt: string;
  itemCount: number;
  paidCents: number;
};

const SUMMARY = `SELECT r.id, r.access_key AS accessKey, s.name AS storeName, r.issued_at AS issuedAt,
  r.item_count AS itemCount, r.paid_cents AS paidCents
  FROM receipts r JOIN stores s ON s.id = r.store_id`;

const aliasCode = (it: ParsedItem) => it.code || `desc:${it.description}`;

export function createReceiptRepo(db: Database) {
  const byKey = db.query(`${SUMMARY} WHERE r.access_key = ?`);
  const page = db.query(`${SUMMARY} ORDER BY r.issued_at DESC, r.id DESC LIMIT ? OFFSET ?`);
  const upsertStore = db.query(
    `INSERT INTO stores (cnpj, name, address) VALUES (?, ?, ?)
     ON CONFLICT (cnpj) DO UPDATE SET name = excluded.name, address = excluded.address RETURNING id`,
  );
  const insertReceipt = db.query(
    `INSERT INTO receipts (access_key, store_id, issued_at, item_count, total_cents, discount_cents, paid_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (access_key) DO NOTHING RETURNING id`,
  );
  const findAlias = db.query("SELECT id FROM product_aliases WHERE store_id = ? AND store_code = ?");
  const insertProduct = db.query("INSERT INTO products (name, unit) VALUES (?, ?) RETURNING id");
  const insertAlias = db.query(
    "INSERT INTO product_aliases (store_id, store_code, description, product_id) VALUES (?, ?, ?, ?) RETURNING id",
  );
  const insertItem = db.query(
    `INSERT INTO receipt_items (receipt_id, line, alias_id, qty, unit, unit_price_cents, total_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );

  const aliasFor = (storeId: number, it: ParsedItem): number => {
    const code = aliasCode(it);
    const found = findAlias.get(storeId, code) as { id: number } | null;
    if (found) return found.id;
    const product = insertProduct.get(it.description, it.unit) as { id: number };
    return (insertAlias.get(storeId, code, it.description, product.id) as { id: number }).id;
  };

  /** Returns false when the receipt was already stored (idempotent re-scan). */
  const insert = db.transaction((r: ParsedReceipt): boolean => {
    const store = upsertStore.get(r.store.cnpj, r.store.name, r.store.address) as { id: number };
    const row = insertReceipt.get(
      r.accessKey,
      store.id,
      r.issuedAt,
      r.itemCount,
      r.totalCents,
      r.discountCents,
      r.paidCents,
    ) as { id: number } | null;
    if (!row) return false;
    for (const it of r.items) {
      insertItem.run(row.id, it.line, aliasFor(store.id, it), it.qty, it.unit, it.unitPriceCents, it.totalCents);
    }
    return true;
  });

  return {
    findByKey: (key: string) => byKey.get(key) as ReceiptSummary | null,
    list: (limit: number, offset: number) => page.all(limit, offset) as ReceiptSummary[],
    insert: (r: ParsedReceipt) => insert(r),
  };
}

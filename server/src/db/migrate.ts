import { Database } from "bun:sqlite";

const MIGRATIONS: string[] = [
  `CREATE TABLE stores (
     id INTEGER PRIMARY KEY,
     cnpj TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL,
     address TEXT NOT NULL DEFAULT ''
   );
   CREATE TABLE receipts (
     id INTEGER PRIMARY KEY,
     access_key TEXT NOT NULL UNIQUE,
     store_id INTEGER NOT NULL REFERENCES stores(id),
     issued_at TEXT NOT NULL,
     item_count INTEGER NOT NULL,
     total_cents INTEGER NOT NULL,
     discount_cents INTEGER NOT NULL,
     paid_cents INTEGER NOT NULL,
     created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
   );
   CREATE INDEX receipts_issued_at ON receipts(issued_at);
   CREATE TABLE products (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     unit TEXT NOT NULL
   );
   CREATE TABLE product_aliases (
     id INTEGER PRIMARY KEY,
     store_id INTEGER NOT NULL REFERENCES stores(id),
     store_code TEXT NOT NULL,
     description TEXT NOT NULL,
     product_id INTEGER NOT NULL REFERENCES products(id),
     UNIQUE (store_id, store_code)
   );
   CREATE INDEX product_aliases_product ON product_aliases(product_id);
   CREATE TABLE receipt_items (
     id INTEGER PRIMARY KEY,
     receipt_id INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
     line INTEGER NOT NULL,
     alias_id INTEGER NOT NULL REFERENCES product_aliases(id),
     qty REAL NOT NULL,
     unit TEXT NOT NULL,
     unit_price_cents INTEGER NOT NULL,
     total_cents INTEGER NOT NULL,
     UNIQUE (receipt_id, line)
   );
   CREATE INDEX receipt_items_alias ON receipt_items(alias_id);
   CREATE TABLE merge_suggestions (
     id INTEGER PRIMARY KEY,
     product_a INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     product_b INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
     reason TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dismissed')),
     CHECK (product_a < product_b),
     UNIQUE (product_a, product_b)
   );`,
];

export function openDb(path: string): Database {
  const db = new Database(path, { create: true, strict: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA busy_timeout = 5000");
  migrate(db);
  return db;
}

function migrate(db: Database) {
  const current = (db.query("PRAGMA user_version").get() as { user_version: number }).user_version;
  for (const [v, sql] of MIGRATIONS.entries()) {
    if (v < current) continue;
    db.transaction(() => {
      db.run(sql);
      db.run(`PRAGMA user_version = ${v + 1}`);
    })();
  }
}

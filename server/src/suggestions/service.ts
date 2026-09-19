import type { Database } from "bun:sqlite";
import { UserError } from "../errors";
import { createProductRepo } from "../products/repo";
import { type CandidateInput, findCandidates } from "./candidates";
import type { Judge } from "./judge";

export type Suggestion = { id: number; a: number; b: number; nameA: string; nameB: string; reason: string };

export function createSuggestionService(db: Database, judge: Judge | null) {
  const products = createProductRepo(db);
  const inputs = db.query(
    `SELECT p.id, p.name, json_group_array(DISTINCT a.store_id) AS stores
     FROM products p JOIN product_aliases a ON a.product_id = p.id GROUP BY p.id LIMIT 5000`,
  );
  const known = db.query("SELECT product_a AS a, product_b AS b FROM merge_suggestions");
  const insert = db.query(
    "INSERT INTO merge_suggestions (product_a, product_b, reason, status) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
  );
  const pending = db.query(
    `SELECT m.id, m.product_a AS a, m.product_b AS b, pa.name AS nameA, pb.name AS nameB, m.reason
     FROM merge_suggestions m JOIN products pa ON pa.id = m.product_a JOIN products pb ON pb.id = m.product_b
     WHERE m.status = 'pending' ORDER BY m.id LIMIT ? OFFSET ?`,
  );
  const byId = db.query(
    "SELECT product_a AS a, product_b AS b FROM merge_suggestions WHERE id = ? AND status = 'pending'",
  );
  const dismiss = db.query("UPDATE merge_suggestions SET status = 'dismissed' WHERE id = ?");

  const find = (id: number) => {
    const s = byId.get(id) as { a: number; b: number } | null;
    if (!s) throw new UserError(`Sugestão ${id} não existe ou já foi resolvida.`, 404);
    return s;
  };

  return {
    list: (limit: number, offset: number) => pending.all(limit, offset) as Suggestion[],
    async refresh(): Promise<{ created: number }> {
      const seen = new Set((known.all() as { a: number; b: number }[]).map((k) => `${k.a}:${k.b}`));
      const all = (inputs.all() as { id: number; name: string; stores: string }[]).map(
        (r): CandidateInput => ({ id: r.id, name: r.name, storeIds: JSON.parse(r.stores) as number[] }),
      );
      const candidates = findCandidates(all, { skip: (a, b) => seen.has(`${a}:${b}`) });
      const verdicts = judge ? await judge(candidates) : null;

      let created = 0;
      candidates.forEach((c, i) => {
        const v = verdicts?.get(i);
        if (verdicts && !v) return;
        const reason = v?.reason || `nomes parecidos (${Math.round(c.score * 100)}%)`;
        const status = v && !v.same ? "dismissed" : "pending";
        if (insert.run(c.a, c.b, reason, status).changes > 0 && status === "pending") created++;
      });
      return { created };
    },
    accept(id: number) {
      const s = find(id);
      products.merge(s.a, [s.b]);
    },
    dismiss(id: number) {
      find(id);
      dismiss.run(id);
    },
  };
}

import type { Database } from "bun:sqlite";
import { ParseError } from "../errors";
import type { FetchHtml } from "../nfce/fetch";
import { parseNfceHtml } from "../nfce/parse";
import { parseNfceInput } from "../nfce/url";
import { createReceiptRepo, type ReceiptSummary } from "./repo";

export type ImportResult = { receipt: ReceiptSummary; created: boolean };

export function createReceiptService(db: Database, fetchHtml: FetchHtml) {
  const repo = createReceiptRepo(db);

  return {
    list: repo.list,
    async importFromInput(input: string): Promise<ImportResult> {
      const ref = parseNfceInput(input);
      const existing = repo.findByKey(ref.accessKey);
      if (existing) return { receipt: existing, created: false };

      const parsed = await parseNfceHtml(await fetchHtml(ref.url));
      if (parsed.accessKey !== ref.accessKey) throw new ParseError("a página retornou outra nota");

      const created = repo.insert(parsed);
      const receipt = repo.findByKey(ref.accessKey);
      if (!receipt) throw new Error(`receipt ${ref.accessKey} missing right after insert`);
      console.log(
        JSON.stringify({ evt: "receipt_import", created, items: parsed.items.length, receiptId: receipt.id }),
      );
      return { receipt, created };
    },
  };
}

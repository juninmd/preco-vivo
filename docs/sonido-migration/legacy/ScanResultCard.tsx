import type { ReceiptSummary } from "../../../web/src/api";
import { day, money } from "../../../web/src/format";

/**
 * Cópia literal do cartão de sucesso de `web/src/pages/ScanPage.tsx` em
 * `origin/main` (`git show origin/main:web/src/pages/ScanPage.tsx`).
 * O recibo virou prop; o markup é o mesmo.
 */
export function ScanResultCard({ receipt, created }: { receipt: ReceiptSummary; created: boolean }) {
  return (
    <div className="card ok">
      <strong>{created ? "Nota importada" : "Essa nota já estava salva"}</strong>
      <p>{receipt.storeName}</p>
      <p className="muted">
        {day(receipt.issuedAt)} · {receipt.itemCount} itens · {money(receipt.paidCents)}
      </p>
      <a href="#/products">Ver preços</a>
    </div>
  );
}

import type { PricePoint } from "../../../web/src/api";
import { day, money } from "../../../web/src/format";

/**
 * Cópia literal da tabela de compras de `web/src/pages/ProductPage.tsx`
 * em `origin/main` (`git show origin/main:web/src/pages/ProductPage.tsx`).
 * Os pontos viraram prop; o markup e as classes são os antigos.
 */
export function PurchasesTable({ points }: { points: PricePoint[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Mercado</th>
          <th scope="col" className="num">
            Preço
          </th>
        </tr>
      </thead>
      <tbody>
        {[...points].reverse().map((p) => (
          <tr key={`${p.receiptId}-${p.unit}`}>
            <td>{day(p.issuedAt)}</td>
            <td>{p.storeName}</td>
            <td className="num">
              {money(p.unitPriceCents)}/{p.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

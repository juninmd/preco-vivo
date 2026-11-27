import type { ProductStats } from "../../../web/src/api";
import { day, money, percent, trendClass, variation } from "../../../web/src/format";

/**
 * Cópia literal do `<li>` de `web/src/pages/ProductsPage.tsx` em `origin/main`
 * (`git show origin/main:web/src/pages/ProductsPage.tsx`).
 * O item virou prop; o markup e as classes são exatamente os antigos.
 */
export function ProductRow({ p }: { p: ProductStats }) {
  const v = variation(p.firstCents, p.lastCents);
  return (
    <li>
      <a href={`#/products/${p.id}`} className="row">
        <span className="grow">
          <span className="name">{p.name}</span>
          <span className="muted small">
            {p.purchases}× · última {day(p.lastSeen)}
            {p.units > 1 && ` · ${p.units} unidades`}
          </span>
        </span>
        <span className="price">
          <span>
            {money(p.lastCents)}
            <span className="muted small">/{p.unit}</span>
          </span>
          {p.purchases > 1 && <span className={`trend ${trendClass(v)}`}>{percent(v)}</span>}
        </span>
      </a>
    </li>
  );
}

import type { ProductSort } from "../../../web/src/api";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "recent", label: "Compra mais recente" },
  { value: "variation", label: "Maior aumento" },
  { value: "name", label: "Nome" },
];

type Props = {
  q: string;
  sort: ProductSort;
  onQuery: (value: string) => void;
  onSort: (value: ProductSort) => void;
};

/**
 * Cópia literal do bloco `.filters` de `web/src/pages/ProductsPage.tsx`
 * em `origin/main` (`git show origin/main:web/src/pages/ProductsPage.tsx`).
 * Só os handlers e o tipo ganharam props; o markup é o mesmo.
 */
export function ProductsToolbar({ q, sort, onQuery, onSort }: Props) {
  return (
    <div className="filters">
      <label className="sr-only" htmlFor="q">
        Buscar produto
      </label>
      <input
        id="q"
        type="search"
        placeholder="Buscar (ex.: café)"
        value={q}
        onChange={(e) => onQuery(e.target.value)}
      />
      <label className="sr-only" htmlFor="sort">
        Ordenar por
      </label>
      <select id="sort" value={sort} onChange={(e) => onSort(e.target.value as ProductSort)}>
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

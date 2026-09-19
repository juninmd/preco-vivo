import { useCallback, useRef, useState } from "react";
import { api, type ProductSort, type ProductStats } from "../api";
import { day, money, percent, trendClass, variation } from "../format";
import { useAsync } from "../useAsync";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "recent", label: "Compra mais recente" },
  { value: "variation", label: "Maior aumento" },
  { value: "name", label: "Nome" },
];

export function ProductsPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<ProductSort>("recent");
  const [extra, setExtra] = useState<ProductStats[]>([]);
  const [more, setMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const generation = useRef(0);
  const first = useAsync(
    useCallback(async () => {
      generation.current++;
      setExtra([]);
      const r = await api.products(q.trim(), sort, 0);
      setMore(r.items.length === 30);
      return r.items;
    }, [q, sort]),
  );

  const items = [...(first.data ?? []), ...extra];
  const loadMore = async () => {
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const r = await api.products(q.trim(), sort, items.length);
      if (gen !== generation.current) return;
      setExtra((e) => [...e, ...r.items]);
      setMore(r.items.length === 30);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section aria-labelledby="products-title">
      <h1 id="products-title">Produtos</h1>
      <div className="filters">
        <label className="sr-only" htmlFor="q">
          Buscar produto
        </label>
        <input id="q" type="search" placeholder="Buscar (ex.: café)" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="sort">
          Ordenar por
        </label>
        <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as ProductSort)}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {first.error && (
        <p role="alert" className="error">
          {first.error}
        </p>
      )}
      {!first.loading && items.length === 0 && !first.error && (
        <p className="muted">Nenhum produto ainda. Leia uma nota em “Ler nota”.</p>
      )}

      <ul className="list">
        {items.map((p) => {
          const v = variation(p.firstCents, p.lastCents);
          return (
            <li key={p.id}>
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
        })}
      </ul>
      {more && items.length > 0 && (
        <button type="button" className="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
          Carregar mais
        </button>
      )}
    </section>
  );
}

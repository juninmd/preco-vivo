import { Badge, Button, EmptyState, PageHeader, SearchField, Select, Skeleton } from "@juninmd/sonido";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ProductSort, type ProductStats } from "../api";
import { day, money, percent, variation } from "../format";
import { useAsync } from "../useAsync";

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "recent", label: "Compra mais recente" },
  { value: "variation", label: "Maior aumento" },
  { value: "name", label: "Nome" },
];

/** Typing pause before the search hits the API: one request per word, not one per keystroke. */
const SEARCH_DEBOUNCE_MS = 300;

const trendTone = (ratio: number) => (ratio > 0.005 ? "danger" : ratio < -0.005 ? "success" : "neutral");

export function ProductsPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);
  const [sort, setSort] = useState<ProductSort>("recent");
  const [extra, setExtra] = useState<ProductStats[]>([]);
  const [more, setMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const generation = useRef(0);
  const busy = useRef(false);
  const first = useAsync(
    useCallback(async () => {
      generation.current++;
      busy.current = false;
      setLoadingMore(false);
      setMoreError(null);
      setExtra([]);
      const r = await api.products(query, sort, 0);
      setMore(r.items.length === 30);
      return r.items;
    }, [query, sort]),
  );

  const items = [...(first.data ?? []), ...extra];
  const loadMore = async () => {
    if (busy.current) return;
    const gen = generation.current;
    busy.current = true;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const r = await api.products(query, sort, items.length);
      if (gen !== generation.current) return;
      const seen = new Set(items.map((i) => i.id));
      setExtra((e) => [...e, ...r.items.filter((i) => !seen.has(i.id))]);
      setMore(r.items.length === 30);
    } catch (e) {
      if (gen === generation.current) setMoreError(e instanceof Error ? e.message : "Falha ao carregar mais produtos.");
    } finally {
      if (gen === generation.current) {
        busy.current = false;
        setLoadingMore(false);
      }
    }
  };

  return (
    <section>
      <PageHeader title="Produtos" titleAs="h1" accent />
      <div className="filters">
        <SearchField label="Buscar produto" placeholder="Buscar (ex.: café)" value={q} onChange={setQ} />
        <Select
          label="Ordenar por"
          hideLabel
          value={sort}
          onChange={(value) => setSort(value as ProductSort)}
          options={SORTS}
        />
      </div>

      {first.error && (
        <p role="alert" className="error">
          {first.error}
        </p>
      )}
      {first.loading && items.length === 0 && <Skeleton label="Carregando produtos…" rows={3} />}
      {!first.loading && items.length === 0 && !first.error && (
        <EmptyState
          title={query ? "Nenhum produto encontrado" : "Nenhum produto ainda"}
          description={query ? `Nada para “${query}”.` : "Leia uma nota em “Ler nota” para começar."}
        />
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
                  {p.purchases > 1 && <Badge tone={trendTone(v)}>{percent(v)}</Badge>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {moreError && (
        <p role="alert" className="error">
          {moreError}
        </p>
      )}
      {more && items.length > 0 && (
        <Button variant="secondary" loading={loadingMore} onClick={() => void loadMore()}>
          {loadingMore ? "Carregando…" : "Carregar mais"}
        </Button>
      )}
    </section>
  );
}

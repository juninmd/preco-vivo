import { useCallback, useRef, useState } from "react";
import { api, type ReceiptSummary } from "../api";
import { day, money } from "../format";
import { useAsync } from "../useAsync";

export function ReceiptsPage() {
  const [extra, setExtra] = useState<ReceiptSummary[]>([]);
  const [more, setMore] = useState(true);
  const first = useAsync(
    useCallback(async () => {
      const r = await api.receipts(0);
      setMore(r.items.length === 30);
      return r.items;
    }, []),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const busy = useRef(false);
  const items = [...(first.data ?? []), ...extra];

  const loadMore = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const r = await api.receipts(items.length);
      const seen = new Set(items.map((i) => i.id));
      setExtra((e) => [...e, ...r.items.filter((i) => !seen.has(i.id))]);
      setMore(r.items.length === 30);
    } catch (e) {
      setMoreError(e instanceof Error ? e.message : "Falha ao carregar mais notas.");
    } finally {
      busy.current = false;
      setLoadingMore(false);
    }
  };

  return (
    <section aria-labelledby="receipts-title">
      <h1 id="receipts-title">Notas</h1>
      {first.error && (
        <p role="alert" className="error">
          {first.error}
        </p>
      )}
      {!first.loading && items.length === 0 && !first.error && <p className="muted">Nenhuma nota importada.</p>}
      <ul className="list">
        {items.map((r) => (
          <li key={r.id} className="row">
            <span className="grow">
              <span className="name">{r.storeName}</span>
              <span className="muted small">
                {day(r.issuedAt)} · {r.itemCount} itens
              </span>
            </span>
            <span className="price">{money(r.paidCents)}</span>
          </li>
        ))}
      </ul>
      {moreError && (
        <p role="alert" className="error">
          {moreError}
        </p>
      )}
      {more && items.length > 0 && (
        <button type="button" className="secondary" disabled={loadingMore} onClick={() => void loadMore()}>
          Carregar mais
        </button>
      )}
    </section>
  );
}

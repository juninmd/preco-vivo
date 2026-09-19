import { useCallback, useState } from "react";
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
  const items = [...(first.data ?? []), ...extra];

  const loadMore = async () => {
    const r = await api.receipts(items.length);
    setExtra((e) => [...e, ...r.items]);
    setMore(r.items.length === 30);
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
      {more && items.length > 0 && (
        <button type="button" className="secondary" onClick={() => void loadMore()}>
          Carregar mais
        </button>
      )}
    </section>
  );
}

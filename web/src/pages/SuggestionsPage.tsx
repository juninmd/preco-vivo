import { useState } from "react";
import { api } from "../api";
import { useAsync } from "../useAsync";

export function SuggestionsPage() {
  const { data, error, loading, setData } = useAsync(api.suggestions);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await fn();
      setData(await api.suggestions());
      if (done) setStatus(done);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const refresh = () =>
    act(async () => {
      const { created } = await api.refreshSuggestions();
      setStatus(created ? `${created} nova(s) sugestão(ões).` : "Nada novo para juntar.");
    }, "");

  return (
    <section aria-labelledby="sugg-title">
      <h1 id="sugg-title">Juntar produtos</h1>
      <p className="muted">
        O mesmo produto pode ter nomes diferentes em cada mercado. Confirme para unir as linhas de preço.
      </p>
      <button type="button" className="primary" onClick={() => void refresh()} disabled={busy}>
        {busy ? "Procurando…" : "Procurar parecidos"}
      </button>
      <p aria-live="polite" className="muted">
        {status}
      </p>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!loading && data?.items.length === 0 && <p className="muted">Nenhuma sugestão pendente.</p>}
      <ul className="list">
        {data?.items.map((s) => (
          <li key={s.id} className="card">
            <p>
              <strong>{s.nameA}</strong>
            </p>
            <p>
              <strong>{s.nameB}</strong>
            </p>
            <p className="muted small">{s.reason}</p>
            <div className="actions">
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => void act(() => api.acceptSuggestion(s.id), "Produtos unidos.")}
              >
                É o mesmo
              </button>
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => void act(() => api.dismissSuggestion(s.id), "Sugestão descartada.")}
              >
                São diferentes
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

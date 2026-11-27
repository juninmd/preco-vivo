import { Button, Card, EmptyState, PageHeader, Skeleton } from "@juninmd/sonido";
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
    <section>
      <PageHeader
        title="Juntar produtos"
        titleAs="h1"
        accent
        description="O mesmo produto pode ter nomes diferentes em cada mercado. Confirme para unir as linhas de preço."
      />
      <Button onClick={() => void refresh()} loading={busy}>
        {busy ? "Procurando…" : "Procurar parecidos"}
      </Button>
      <p aria-live="polite" className="muted">
        {status}
      </p>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {loading && !data && <Skeleton label="Carregando sugestões…" rows={3} />}
      {!loading && data?.items.length === 0 && (
        <EmptyState
          title="Nenhuma sugestão pendente"
          description="Quando dois nomes parecerem o mesmo produto, eles aparecem aqui."
        />
      )}
      <ul className="list">
        {data?.items.map((s) => (
          <li key={s.id}>
            <Card surface="solid" padding="sm" className="card">
              <p>
                <strong>{s.nameA}</strong>
              </p>
              <p>
                <strong>{s.nameB}</strong>
              </p>
              <p className="muted small">{s.reason}</p>
              <div className="actions">
                <Button disabled={busy} onClick={() => void act(() => api.acceptSuggestion(s.id), "Produtos unidos.")}>
                  É o mesmo
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void act(() => api.dismissSuggestion(s.id), "Sugestão descartada.")}
                >
                  São diferentes
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}

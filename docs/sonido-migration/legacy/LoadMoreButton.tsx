/**
 * Cópia literal do botão de paginação de `web/src/pages/ProductsPage.tsx`
 * em `origin/main` (`git show origin/main:web/src/pages/ProductsPage.tsx`).
 */
export function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" className="secondary" disabled={loading} onClick={onClick}>
      {loading ? "Carregando…" : "Carregar mais"}
    </button>
  );
}

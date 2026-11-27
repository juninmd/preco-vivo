/**
 * Cópia literal do estado vazio de `web/src/pages/ProductsPage.tsx` em
 * `origin/main` (`git show origin/main:web/src/pages/ProductsPage.tsx`).
 */
export function EmptyProducts({ query }: { query: string }) {
  return (
    <p className="muted">
      {query ? `Nenhum produto encontrado para “${query}”.` : "Nenhum produto ainda. Leia uma nota em “Ler nota”."}
    </p>
  );
}

import { useEffect, useState } from "react";
import { ProductPage } from "./pages/ProductPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ReceiptsPage } from "./pages/ReceiptsPage";
import { ScanPage } from "./pages/ScanPage";
import { SettingsPage } from "./pages/SettingsPage";
import { SuggestionsPage } from "./pages/SuggestionsPage";

const TABS = [
  { href: "#/scan", label: "Ler nota" },
  { href: "#/products", label: "Produtos" },
  { href: "#/receipts", label: "Notas" },
  { href: "#/suggestions", label: "Juntar" },
  { href: "#/settings", label: "Config" },
];

function useHash() {
  const [hash, setHash] = useState(() => window.location.hash || "#/scan");
  useEffect(() => {
    const on = () => setHash(window.location.hash || "#/scan");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

function Page({ hash }: { hash: string }) {
  const product = /^#\/products\/(\d+)$/.exec(hash);
  if (product) return <ProductPage id={Number(product[1])} />;
  switch (hash) {
    case "#/products":
      return <ProductsPage />;
    case "#/receipts":
      return <ReceiptsPage />;
    case "#/suggestions":
      return <SuggestionsPage />;
    case "#/settings":
      return <SettingsPage />;
    default:
      return <ScanPage />;
  }
}

export default function App() {
  const hash = useHash();
  return (
    <>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <main id="main">
        <Page hash={hash} />
      </main>
      <nav aria-label="Principal" className="tabs">
        {TABS.map((t) => (
          <a key={t.href} href={t.href} aria-current={hash.startsWith(t.href) ? "page" : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
    </>
  );
}

import { Badge, Button, Card, DataTable, EmptyState, PageHeader, SearchField, Select, SubTabs } from "@juninmd/sonido";
import { type ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import "@juninmd/sonido/styles.css";
import "../../web/src/index.css";
import "../../web/src/components.css";
import "../../web/src/sonido.css";
import type { PricePoint, ProductSort, ProductStats, ReceiptSummary } from "../../web/src/api";
import { day, money, percent, variation } from "../../web/src/format";
import { EmptyProducts } from "./legacy/EmptyProducts";
import { LoadMoreButton } from "./legacy/LoadMoreButton";
import { PageTitle } from "./legacy/PageTitle";
import { ProductRow } from "./legacy/ProductRow";
import { ProductsToolbar } from "./legacy/ProductsToolbar";
import { PurchasesTable } from "./legacy/PurchasesTable";
import { ScanResultCard } from "./legacy/ScanResultCard";
import { UnitSelector } from "./legacy/UnitSelector";
import "./preview.css";

// Dados fictícios: nenhum produto, mercado ou preço real do usuário.
const PRODUCTS: ProductStats[] = [
  {
    id: 1,
    name: "Café Torrado 500 g",
    unit: "un",
    units: 1,
    purchases: 4,
    minCents: 1750,
    maxCents: 2149,
    firstCents: 1890,
    lastCents: 2149,
    lastSeen: "2026-11-12T18:30:00-03:00",
  },
  {
    id: 2,
    name: "Leite Integral 1 L",
    unit: "L",
    units: 1,
    purchases: 6,
    minCents: 459,
    maxCents: 529,
    firstCents: 499,
    lastCents: 479,
    lastSeen: "2026-11-10T09:10:00-03:00",
  },
  {
    id: 3,
    name: "Arroz Branco 5 kg",
    unit: "kg",
    units: 1,
    purchases: 2,
    minCents: 2790,
    maxCents: 2790,
    firstCents: 2790,
    lastCents: 2790,
    lastSeen: "2026-10-28T16:45:00-03:00",
  },
];

const RECEIPT: ReceiptSummary = {
  id: 1,
  accessKey: "0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000",
  storeName: "Mercado Bom Preço",
  issuedAt: "2026-11-12T18:30:00-03:00",
  itemCount: 12,
  paidCents: 18742,
};

const POINTS: PricePoint[] = [
  {
    receiptId: 1,
    issuedAt: "2026-10-05T10:00:00-03:00",
    unitPriceCents: 1890,
    qty: 1,
    unit: "un",
    storeName: "Mercado Bom Preço",
  },
  {
    receiptId: 2,
    issuedAt: "2026-10-19T15:20:00-03:00",
    unitPriceCents: 1999,
    qty: 1,
    unit: "un",
    storeName: "Supermercado Central",
  },
  {
    receiptId: 3,
    issuedAt: "2026-11-12T18:30:00-03:00",
    unitPriceCents: 2149,
    qty: 1,
    unit: "un",
    storeName: "Mercado Bom Preço",
  },
];

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "recent", label: "Compra mais recente" },
  { value: "variation", label: "Maior aumento" },
  { value: "name", label: "Nome" },
];

const trendTone = (ratio: number) => (ratio > 0.005 ? "danger" : ratio < -0.005 ? "success" : "neutral");

function Row({
  title,
  hint,
  source,
  before,
  after,
}: {
  title: string;
  hint: string;
  source: string;
  before: ReactNode;
  after: ReactNode;
}) {
  return (
    <section className="pv-row">
      <header className="pv-row__head">
        <h2>{title}</h2>
        <p>{hint}</p>
        <code>{source}</code>
      </header>
      <div className="pv-cols">
        <div className="pv-col">
          <h3>Antes · componente do preco-vivo</h3>
          <div className="pv-stage">{before}</div>
        </div>
        <div className="pv-col">
          <h3>Depois · @juninmd/sonido</h3>
          <div className="pv-stage">{after}</div>
        </div>
      </div>
    </section>
  );
}

function AfterProductRow({ p }: { p: ProductStats }) {
  const v = variation(p.firstCents, p.lastCents);
  return (
    <li>
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
}

function ToolbarDemo() {
  const [beforeQ, setBeforeQ] = useState("");
  const [beforeSort, setBeforeSort] = useState<ProductSort>("recent");
  const [afterQ, setAfterQ] = useState("");
  const [afterSort, setAfterSort] = useState<ProductSort>("recent");
  return (
    <Row
      title="Busca e ordenação"
      hint="Mesmo debounce de 300 ms no app; o Sonido entra no campo e no select."
      source="web/src/pages/ProductsPage.tsx"
      before={<ProductsToolbar q={beforeQ} sort={beforeSort} onQuery={setBeforeQ} onSort={setBeforeSort} />}
      after={
        <div className="filters">
          <SearchField label="Buscar produto" placeholder="Buscar (ex.: café)" value={afterQ} onChange={setAfterQ} />
          <Select
            label="Ordenar por"
            hideLabel
            value={afterSort}
            onChange={(value) => setAfterSort(value as ProductSort)}
            options={SORTS}
          />
        </div>
      }
    />
  );
}

function UnitsDemo() {
  const [beforeUnit, setBeforeUnit] = useState("kg");
  const [afterUnit, setAfterUnit] = useState("kg");
  return (
    <Row
      title="Seletor de unidade"
      hint="O fieldset com aria-pressed vira o tablist do SubTabs, com foco itinerante."
      source="web/src/pages/ProductPage.tsx"
      before={<UnitSelector units={["un", "kg"]} unit={beforeUnit} onChange={setBeforeUnit} />}
      after={
        <div className="unit-switch">
          <p className="muted small">Vendido em unidades diferentes. Preços só são comparados na mesma unidade:</p>
          <SubTabs
            label="Unidade de venda"
            items={[
              { key: "un", label: "un" },
              { key: "kg", label: "kg" },
            ]}
            value={afterUnit}
            onChange={setAfterUnit}
          />
        </div>
      }
    />
  );
}

function PurchasesDemo() {
  return (
    <Row
      title="Tabela de compras"
      hint="A tabela ganha ordenação por coluna (aria-sort) sem perder as três colunas."
      source="web/src/pages/ProductPage.tsx"
      before={<PurchasesTable points={POINTS} />}
      after={
        <DataTable
          label="Compras de Café Torrado 500 g"
          columns={[
            { key: "date", label: "Data", sort: (p: PricePoint) => p.issuedAt, render: (p) => day(p.issuedAt) },
            {
              key: "store",
              label: "Mercado",
              sort: (p: PricePoint) => p.storeName,
              render: (p) => p.storeName,
            },
            {
              key: "price",
              label: "Preço",
              align: "end",
              sort: (p: PricePoint) => p.unitPriceCents,
              render: (p) => `${money(p.unitPriceCents)}/${p.unit}`,
            },
          ]}
          rows={[...POINTS].reverse()}
          rowKey={(p) => `${p.receiptId}-${p.unit}`}
        />
      }
    />
  );
}

function Page() {
  return (
    <div className="pv-page">
      <header className="pv-head">
        <p className="pv-kicker">Preço Vivo · migração de UI</p>
        <h1>Antes e depois do @juninmd/sonido 2.5.0</h1>
        <p>
          Lado esquerdo: markup de <code>origin/main</code>. Lado direito: as mesmas telas com as primitivas do design
          system, usando o CSS real do app e a ponte de tokens. Dados fictícios.
        </p>
      </header>

      <Row
        title="Cabeçalho de página"
        hint="O h1 solto vira PageHeader com a lavada radial do accent."
        source="web/src/pages/ProductsPage.tsx"
        before={<PageTitle id="pv-before-title" title="Produtos" />}
        after={<PageHeader title="Produtos" titleAs="h1" accent />}
      />

      <ToolbarDemo />

      <Row
        title="Linha de produto e tendência"
        hint="A variação em texto colorido vira Badge com tom semântico (alta = danger, queda = success)."
        source="web/src/pages/ProductsPage.tsx"
        before={
          <ul className="list">
            {PRODUCTS.map((p) => (
              <ProductRow key={p.id} p={p} />
            ))}
          </ul>
        }
        after={
          <ul className="list">
            {PRODUCTS.map((p) => (
              <AfterProductRow key={p.id} p={p} />
            ))}
          </ul>
        }
      />

      <Row
        title="Carregar mais"
        hint="Button variant=secondary com loading: spinner, disabled e aria-busy vêm do Sonido."
        source="web/src/pages/ProductsPage.tsx"
        before={<LoadMoreButton loading={false} onClick={() => {}} />}
        after={
          <Button variant="secondary" onClick={() => {}}>
            Carregar mais
          </Button>
        }
      />

      <Row
        title="Estado vazio"
        hint="O parágrafo muted vira EmptyState com título, descrição e área de ação."
        source="web/src/pages/ProductsPage.tsx"
        before={<EmptyProducts query="" />}
        after={<EmptyState title="Nenhum produto ainda" description="Leia uma nota em “Ler nota” para começar." />}
      />

      <Row
        title="Resultado da leitura"
        hint="O cartão com strong vira Card + Badge de sucesso; a mensagem e o link continuam iguais."
        source="web/src/pages/ScanPage.tsx"
        before={<ScanResultCard receipt={RECEIPT} created />}
        after={
          <Card surface="solid" padding="sm" className="card ok">
            <div>
              <Badge tone="success" dot>
                Nota importada
              </Badge>
            </div>
            <p>{RECEIPT.storeName}</p>
            <p className="muted">
              {day(RECEIPT.issuedAt)} · {RECEIPT.itemCount} itens · {money(RECEIPT.paidCents)}
            </p>
            <a href="#/products">Ver preços</a>
          </Card>
        }
      />

      <UnitsDemo />

      <PurchasesDemo />

      <footer className="pv-foot">
        <p>
          Capturas em Chromium 1180×900, full page, device scale 2. Tema escuro em <code>?theme=dark</code>.
        </p>
      </footer>
    </div>
  );
}

const theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light";
document.documentElement.dataset.theme = theme;

const root = document.getElementById("root");
if (!root) throw new Error("#root element missing from preview.html");

createRoot(root).render(<Page />);

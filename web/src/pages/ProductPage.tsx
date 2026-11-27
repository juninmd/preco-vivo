import { Badge, Button, DataTable, PageHeader, Skeleton, SubTabs, TextField } from "@juninmd/sonido";
import { type FormEvent, useCallback, useState } from "react";
import { api, type PricePoint } from "../api";
import { PriceChart } from "../components/PriceChart";
import { day, money } from "../format";
import { useAsync } from "../useAsync";

export function ProductPage({ id }: { id: number }) {
  const { data, error, loading, setData } = useAsync(useCallback(() => api.product(id), [id]));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chosenUnit, setChosenUnit] = useState<string | null>(null);

  if (loading && !data) return <Skeleton label="Carregando produto…" rows={4} />;
  if (error || !data)
    return (
      <p role="alert" className="error">
        {error ?? "Produto não encontrado."}
      </p>
    );

  const units = [...new Set(data.points.map((p) => p.unit))];
  const unit = chosenUnit && units.includes(chosenUnit) ? chosenUnit : data.points.at(-1)?.unit;
  const chartPoints = data.points.filter((p) => p.unit === unit);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setData(await api.rename(id, name));
      setEditing(false);
      setSaveError(null);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  const columns = [
    { key: "date", label: "Data", sort: (p: PricePoint) => p.issuedAt, render: (p: PricePoint) => day(p.issuedAt) },
    {
      key: "store",
      label: "Mercado",
      sort: (p: PricePoint) => p.storeName,
      render: (p: PricePoint) => p.storeName,
    },
    {
      key: "price",
      label: "Preço",
      align: "end" as const,
      sort: (p: PricePoint) => p.unitPriceCents,
      render: (p: PricePoint) => `${money(p.unitPriceCents)}/${p.unit}`,
    },
  ];

  return (
    <section>
      <PageHeader
        title={data.name}
        titleAs="h1"
        accent
        leading={
          <Button href="#/products" variant="link" size="sm">
            ← Produtos
          </Button>
        }
        actions={
          !editing && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setName(data.name);
                setEditing(true);
              }}
            >
              Renomear
            </Button>
          )
        }
      />

      {editing && (
        <form onSubmit={save} className="stack">
          <TextField
            label="Nome do produto"
            id="rename"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="actions">
            <Button type="submit" disabled={!name.trim()}>
              Salvar
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
          {saveError && (
            <p role="alert" className="error">
              {saveError}
            </p>
          )}
        </form>
      )}

      {units.length > 1 && (
        <div className="unit-switch">
          <p className="muted small">Vendido em unidades diferentes. Preços só são comparados na mesma unidade:</p>
          <SubTabs
            label="Unidade de venda"
            items={units.map((u) => ({ key: u, label: u }))}
            value={unit ?? units[0]}
            onChange={setChosenUnit}
          />
        </div>
      )}
      <PriceChart points={chartPoints} />

      <h2>Compras</h2>
      <DataTable
        label={`Compras de ${data.name}`}
        columns={columns}
        rows={[...data.points].reverse()}
        rowKey={(p) => `${p.receiptId}-${p.unit}`}
      />

      <h2>Como aparece nos cupons</h2>
      <ul className="plain">
        {data.aliases.map((a) => (
          <li key={`${a.storeName}-${a.storeCode}`}>
            {a.description} <Badge tone="neutral">{a.storeName}</Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

import { type FormEvent, useCallback, useState } from "react";
import { api } from "../api";
import { PriceChart } from "../components/PriceChart";
import { day, money } from "../format";
import { useAsync } from "../useAsync";

export function ProductPage({ id }: { id: number }) {
  const { data, error, loading, setData } = useAsync(useCallback(() => api.product(id), [id]));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chosenUnit, setChosenUnit] = useState<string | null>(null);

  if (loading && !data) return <p className="muted">Carregando…</p>;
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

  return (
    <section aria-labelledby="product-title">
      <a href="#/products" className="back">
        ← Produtos
      </a>
      {editing ? (
        <form onSubmit={save} className="stack">
          <label htmlFor="rename">Nome do produto</label>
          <input id="rename" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
          <div className="actions">
            <button type="submit" className="primary" disabled={!name.trim()}>
              Salvar
            </button>
            <button type="button" className="secondary" onClick={() => setEditing(false)}>
              Cancelar
            </button>
          </div>
          {saveError && (
            <p role="alert" className="error">
              {saveError}
            </p>
          )}
        </form>
      ) : (
        <div className="title-row">
          <h1 id="product-title">{data.name}</h1>
          <button
            type="button"
            className="link"
            onClick={() => {
              setName(data.name);
              setEditing(true);
            }}
          >
            Renomear
          </button>
        </div>
      )}

      {units.length > 1 && (
        <fieldset className="segmented">
          <legend className="muted small">
            Vendido em unidades diferentes. Preços só são comparados na mesma unidade:
          </legend>
          {units.map((u) => (
            <button key={u} type="button" aria-pressed={u === unit} onClick={() => setChosenUnit(u)}>
              {u}
            </button>
          ))}
        </fieldset>
      )}
      <PriceChart points={chartPoints} />

      <h2>Compras</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Mercado</th>
            <th scope="col" className="num">
              Preço
            </th>
          </tr>
        </thead>
        <tbody>
          {[...data.points].reverse().map((p) => (
            <tr key={`${p.receiptId}-${p.unit}`}>
              <td>{day(p.issuedAt)}</td>
              <td>{p.storeName}</td>
              <td className="num">
                {money(p.unitPriceCents)}/{p.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Como aparece nos cupons</h2>
      <ul className="plain">
        {data.aliases.map((a) => (
          <li key={`${a.storeName}-${a.storeCode}`}>
            {a.description} <span className="muted small">· {a.storeName}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

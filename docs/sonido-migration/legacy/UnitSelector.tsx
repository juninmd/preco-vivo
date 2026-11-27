/**
 * Cópia literal do seletor de unidades de `web/src/pages/ProductPage.tsx`
 * em `origin/main` (`git show origin/main:web/src/pages/ProductPage.tsx`).
 */
export function UnitSelector({
  units,
  unit,
  onChange,
}: {
  units: string[];
  unit: string;
  onChange: (unit: string) => void;
}) {
  return (
    <fieldset className="segmented">
      <legend className="muted small">
        Vendido em unidades diferentes. Preços só são comparados na mesma unidade:
      </legend>
      {units.map((u) => (
        <button key={u} type="button" aria-pressed={u === unit} onClick={() => onChange(u)}>
          {u}
        </button>
      ))}
    </fieldset>
  );
}

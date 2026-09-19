import type { PricePoint } from "../api";
import { day, money, percent, variation } from "../format";

const W = 400;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 30, left: 66 };

export function PriceChart({ points }: { points: PricePoint[] }) {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return <p className="muted">Sem compras registradas.</p>;

  const series = points.map((p) => ({ ...p, t: new Date(p.issuedAt).getTime() }));
  const times = series.map((p) => p.t);
  const prices = series.map((p) => p.unitPriceCents);
  const [t0, t1] = [Math.min(...times), Math.max(...times)];
  const [lo, hi] = [Math.min(...prices), Math.max(...prices)];
  const yPad = Math.max((hi - lo) * 0.15, hi * 0.05, 1);
  const [y0, y1] = [Math.max(0, lo - yPad), hi + yPad];

  const x = (t: number) => PAD.left + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - PAD.left - PAD.right);
  const y = (c: number) => PAD.top + (1 - (c - y0) / (y1 - y0)) * (H - PAD.top - PAD.bottom);
  const path = series.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)},${y(p.unitPriceCents).toFixed(1)}`).join(" ");
  const ticks = [y0, (y0 + y1) / 2, y1];
  const change = percent(variation(first.unitPriceCents, last.unitPriceCents));
  const summary = `Preço foi de ${money(first.unitPriceCents)} em ${day(first.issuedAt)} para ${money(last.unitPriceCents)} em ${day(last.issuedAt)} (${change}); mínimo ${money(lo)}, máximo ${money(hi)}.`;

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="axis" x={PAD.left - 8} y={y(t) + 4} textAnchor="end">
              {money(Math.round(t))}
            </text>
          </g>
        ))}
        <text className="axis" x={PAD.left} y={H - 10}>
          {day(first.issuedAt)}
        </text>
        <text className="axis" x={W - PAD.right} y={H - 10} textAnchor="end">
          {day(last.issuedAt)}
        </text>
        <path className="line" d={path} />
        {series.map((p) => (
          <circle key={p.itemId} className="dot" cx={x(p.t)} cy={y(p.unitPriceCents)} r={5}>
            <title>{`${day(p.issuedAt)} · ${p.storeName} · ${money(p.unitPriceCents)}/${p.unit}`}</title>
          </circle>
        ))}
      </svg>
      <figcaption className="muted">{summary}</figcaption>
    </figure>
  );
}

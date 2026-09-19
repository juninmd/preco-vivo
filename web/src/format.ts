const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const pct = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" });

export const money = (cents: number) => brl.format(cents / 100);
export const day = (iso: string) => date.format(new Date(iso));
export const variation = (first: number, last: number) => (first > 0 ? (last - first) / first : 0);
export const percent = (ratio: number) => pct.format(ratio);
export const trendClass = (ratio: number) => (ratio > 0.005 ? "up" : ratio < -0.005 ? "down" : "flat");

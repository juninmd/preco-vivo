import { ParseError } from "../errors";

const BR_DECIMAL = /^(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/;

export function parseBrDecimal(raw: string): number {
  const s = raw.replace(/[\s ]|R\$/g, "");
  if (!BR_DECIMAL.test(s)) throw new ParseError(`número inválido "${raw.trim()}"`);
  return Number(s.replace(/\./g, "").replace(",", "."));
}

export function parseBrlToCents(raw: string): number {
  return Math.round(parseBrDecimal(raw) * 100);
}

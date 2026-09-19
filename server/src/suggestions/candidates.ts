export type CandidateInput = { id: number; name: string; storeIds: number[] };
export type Candidate = { a: number; b: number; nameA: string; nameB: string; score: number };

const SIZE = /\b(\d+(?:[.,]\d+)?)\s*(KG|G|GR|ML|L|LT)\b/;
const MAX_GROUP = 200;

export function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9,.]+/g, " ")
    .trim();
}

export function sizeOf(norm: string): string | null {
  const [, amount, unit] = SIZE.exec(norm) ?? [];
  if (!amount || !unit) return null;
  const n = Number(amount.replace(",", "."));
  if (unit === "KG") return `${n * 1000}G`;
  if (unit === "L" || unit === "LT") return `${n * 1000}ML`;
  return `${n}${unit === "GR" ? "G" : unit}`;
}

function words(norm: string): string[] {
  return norm
    .replace(SIZE, " ")
    .split(/[\s,.]+/)
    .filter((w) => w.length >= 2 && !/^\d+$/.test(w));
}

const modelNumbers = (norm: string) => (norm.replace(SIZE, " ").match(/\b\d+\b/g) ?? []).join(" ");

const sameWord = (x: string, y: string) =>
  x === y || (Math.min(x.length, y.length) >= 3 && (x.startsWith(y) || y.startsWith(x)));

/** Dice coefficient where abbreviations ("CAF" ~ "CAFE") count as a match. */
export function similarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const used = new Set<number>();
  let matched = 0;
  for (const w of a) {
    const j = b.findIndex((v, i) => !used.has(i) && sameWord(w, v));
    if (j >= 0) {
      used.add(j);
      matched++;
    }
  }
  return (2 * matched) / (a.length + b.length);
}

type FindOptions = { skip?: (a: number, b: number) => boolean; minScore?: number; maxPairs?: number };

export function findCandidates(
  products: CandidateInput[],
  { skip, minScore = 0.6, maxPairs = 50 }: FindOptions = {},
): Candidate[] {
  const groups = new Map<string, { p: CandidateInput; words: string[]; numbers: string }[]>();
  for (const p of products) {
    const norm = normalize(p.name);
    const w = words(norm);
    const key = sizeOf(norm) ?? `word:${w[0] ?? ""}`;
    const g = groups.get(key) ?? [];
    if (g.length < MAX_GROUP) g.push({ p, words: w, numbers: modelNumbers(norm) });
    groups.set(key, g);
  }

  const out: Candidate[] = [];
  for (const g of groups.values()) {
    for (const [i, x] of g.entries()) {
      for (const y of g.slice(i + 1)) {
        if (x.numbers !== y.numbers || x.p.storeIds.some((s) => y.p.storeIds.includes(s))) continue;
        const score = similarity(x.words, y.words);
        if (score < minScore) continue;
        const [a, b] = x.p.id < y.p.id ? [x.p, y.p] : [y.p, x.p];
        if (skip?.(a.id, b.id)) continue;
        out.push({ a: a.id, b: b.id, nameA: a.name, nameB: b.name, score });
      }
    }
  }
  return out.sort((l, r) => r.score - l.score).slice(0, maxPairs);
}

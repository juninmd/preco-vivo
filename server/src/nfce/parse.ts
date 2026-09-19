import { ParseError } from "../errors";
import { decodeEntities } from "./entities";
import { parseBrDecimal, parseBrlToCents } from "./money";

export type ParsedItem = {
  line: number;
  description: string;
  code: string;
  qty: number;
  unit: string;
  unitPriceCents: number;
  totalCents: number;
};

export type ParsedReceipt = {
  accessKey: string;
  store: { cnpj: string; name: string; address: string };
  issuedAt: string;
  itemCount: number;
  totalCents: number;
  discountCents: number;
  paidCents: number;
  items: ParsedItem[];
};

type RawRow = { name: string; code: string; qty: string; unit: string; unitPrice: string; total: string };
type Collected = {
  rows: RawRow[];
  totals: { label: string; value: string }[];
  storeName: string;
  texts: string[];
  key: string;
  page: string;
};

const clean = (s: string) =>
  decodeEntities(s)
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
const stripLabel = (s: string) => clean(s.replace(/^[^:]*:/, ""));

async function collect(html: string): Promise<Collected> {
  const c: Collected = { rows: [], totals: [], storeName: "", texts: [], key: "", page: "" };
  const row = () => c.rows[c.rows.length - 1];
  const onRow = (field: keyof RawRow) => ({
    text(t: { text: string }) {
      const r = row();
      if (r) r[field] += t.text;
    },
  });
  await new HTMLRewriter()
    .on('#tabResult tr[id^="Item"]', {
      element() {
        c.rows.push({ name: "", code: "", qty: "", unit: "", unitPrice: "", total: "" });
      },
    })
    .on("#tabResult span.txtTit", onRow("name"))
    .on("#tabResult span.txtTit2", onRow("name"))
    .on("#tabResult span.RCod", onRow("code"))
    .on("#tabResult span.Rqtd", onRow("qty"))
    .on("#tabResult span.RUN", onRow("unit"))
    .on("#tabResult span.RvlUnit", onRow("unitPrice"))
    .on("#tabResult span.valor", onRow("total"))
    .on("#linhaTotal", {
      element() {
        c.totals.push({ label: "", value: "" });
      },
    })
    .on("#linhaTotal label", {
      text(t) {
        const x = c.totals.at(-1);
        if (x) x.label += t.text;
      },
    })
    .on("#linhaTotal span.totalNumb", {
      text(t) {
        const x = c.totals.at(-1);
        if (x) x.value += t.text;
      },
    })
    .on(".txtTopo", {
      text(t) {
        c.storeName += t.text;
      },
    })
    .on("div.text", {
      element() {
        c.texts.push("");
      },
      text(t) {
        c.texts[c.texts.length - 1] += t.text;
      },
    })
    .on("span.chave", {
      text(t) {
        c.key += t.text;
      },
    })
    .on("body", {
      text(t) {
        c.page += t.text;
      },
    })
    .transform(new Response(html))
    .text();
  return c;
}

function totalOf(c: Collected, label: RegExp, fallback?: string): string {
  const hit = c.totals.find((t) => label.test(clean(t.label)));
  if (hit) return hit.value;
  if (fallback === undefined) throw new ParseError(`total "${label.source}" ausente`);
  return fallback;
}

function issuedAt(page: string): string {
  const m = /Emiss[ãa]o:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})(:\d{2})?\s*([+-]\d{2}:\d{2})?/.exec(page);
  if (!m) throw new ParseError("data de emissão ausente");
  return `${m[3]}-${m[2]}-${m[1]}T${m[4]}${m[5] ?? ":00"}${m[6] ?? "-03:00"}`;
}

function toItem(r: RawRow, i: number): ParsedItem {
  const description = clean(r.name);
  if (!description) throw new ParseError(`item ${i + 1} sem descrição`);
  return {
    line: i + 1,
    description,
    code: clean(r.code)
      .replace(/^\(?\s*C[óo]digo:\s*/i, "")
      .replace(/\s*\)$/, ""),
    qty: parseBrDecimal(stripLabel(r.qty)),
    unit: stripLabel(r.unit).toUpperCase() || "UN",
    unitPriceCents: parseBrlToCents(stripLabel(r.unitPrice)),
    totalCents: parseBrlToCents(clean(r.total)),
  };
}

export async function parseNfceHtml(html: string): Promise<ParsedReceipt> {
  const c = await collect(html);
  if (c.rows.length === 0) throw new ParseError("nenhum item encontrado (página da SEFAZ mudou ou nota inválida)");

  const items = c.rows.map(toItem);
  const itemCount = parseBrDecimal(totalOf(c, /^Qtd\. total de itens/i));
  const paidRaw = totalOf(c, /^Valor a pagar/i);
  // SEFAZ omits "Valor total" and "Descontos" when the receipt has no discount.
  const totalCents = parseBrlToCents(totalOf(c, /^Valor total/i, paidRaw));
  const discountCents = parseBrlToCents(totalOf(c, /^Descontos/i, "0"));
  const paidCents = parseBrlToCents(paidRaw);

  if (itemCount !== items.length) throw new ParseError(`esperava ${itemCount} itens, li ${items.length}`);
  const sum = items.reduce((acc, it) => acc + it.totalCents, 0);
  if (sum !== totalCents) throw new ParseError(`soma dos itens (${sum}) difere do total (${totalCents})`);

  const cnpjAt = c.texts.findIndex((t) => /CNPJ/i.test(t));
  const cnpj = (c.texts[cnpjAt] ?? "").replace(/\D/g, "");
  if (cnpj.length !== 14) throw new ParseError("CNPJ do emitente ausente");
  const address = clean(c.texts[cnpjAt + 1] ?? "")
    .split(/\s*,\s*/)
    .filter(Boolean)
    .join(", ");

  return {
    accessKey: c.key.replace(/\D/g, ""),
    store: { cnpj, name: clean(c.storeName), address },
    issuedAt: issuedAt(clean(c.page)),
    itemCount,
    totalCents,
    discountCents,
    paidCents,
    items,
  };
}

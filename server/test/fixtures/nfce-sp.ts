import { accessKeyCheckDigit } from "../../src/nfce/access-key";

export type FixtureItem = { name: string; code: string; qty: string; unit: string; unitPrice: string; total: string };

export function makeKey({
  state = "35",
  yymm = "2609",
  cnpj = "12345678000190",
  model = "65",
  number = "000012345",
} = {}) {
  const first43 = `${state}${yymm}${cnpj}${model}001${number}1${"12345678"}`;
  return first43 + accessKeyCheckDigit(first43);
}

export const qrUrl = (key: string, host = "www.nfce.fazenda.sp.gov.br") =>
  `http://${host}/qrcode?p=${key}|2|1|1|ABCDEF0123456789ABCDEF0123456789ABCDEF01`;

export const BANANA: FixtureItem = {
  name: "BANANA NANICA KG",
  code: "2001",
  qty: "1,235",
  unit: "KG",
  unitPrice: "5,99",
  total: "7,40",
};
export const CAFE: FixtureItem = {
  name: "CAFE PILAO TRAD 500G",
  code: "7896089012453",
  qty: "2",
  unit: "UN",
  unitPrice: "18,90",
  total: "37,80",
};
export const LEITE: FixtureItem = {
  name: "LEITE ITALAC INT 1L",
  code: "7898080640017",
  qty: "12",
  unit: "UN",
  unitPrice: "4,79",
  total: "57,48",
};

export const DEFAULT_ITEMS: FixtureItem[] = [BANANA, CAFE, LEITE];

type Opts = {
  key?: string;
  items?: FixtureItem[];
  total?: string;
  count?: string;
  discount?: string;
  /** SEFAZ omits "Valor total" and "Descontos" when there is no discount. */
  noDiscountRows?: boolean;
  paid?: string;
  issued?: string;
  storeName?: string;
  cnpj?: string;
};

const row = (it: FixtureItem, i: number) => `
  <tr id="Item + ${i + 1}">
    <td valign="top"><span class="txtTit">${it.name}</span><span class="RCod">
        (Código:
        ${it.code}
        )
      </span>
      <br>
      <span class="Rqtd"><strong>Qtde.:</strong>${it.qty}</span><span class="RUN"><strong>UN:
        </strong>${it.unit}</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>
        &nbsp;
        ${it.unitPrice}</span></td>
    <td class="txtTit noWrap" valign="top" align="right">
      Vl. Total
      <br>
      <span class="valor">${it.total}</span></td>
  </tr>`;

export function buildNfceHtml(o: Opts = {}): string {
  const items = o.items ?? DEFAULT_ITEMS;
  const key = o.key ?? makeKey();
  const spaced = key.replace(/(\d{4})/g, "$1 ").trim();
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
  <div data-role="page"><div id="conteudo">
    <div class="txtCenter">
      <div class="txtTopo" id="u20">${o.storeName ?? "SUPERMERCADO EXEMPLO LTDA"}</div>
      <div class="text">
        CNPJ:
        ${o.cnpj ?? "12.345.678/0001-90"}</div>
      <div class="text">RUA UM
        ,
        100
        ,
        CENTRO
        ,
        FRANCA
        ,
        SP</div>
    </div>
    <table data-filter="true" id="tabResult"><tbody>${items.map(row).join("")}</tbody></table>
    <div class="txtRight" id="totalNota">
      <div id="linhaTotal"><label>Qtd. total de itens:</label><span class="totalNumb">${o.count ?? items.length}</span></div>
      ${
        o.noDiscountRows
          ? ""
          : `<div id="linhaTotal"><label>Valor total R$:</label><span class="totalNumb">${o.total ?? "102,68"}</span></div>
      <div id="linhaTotal"><label>Descontos R$:</label><span class="totalNumb">${o.discount ?? "2,68"}</span></div>`
      }
      <div class="linhaShade" id="linhaTotal"><label>Valor a pagar R$:</label><span class="totalNumb txtMax">${o.paid ?? "100,00"}</span></div>
      <div id="linhaForma"><label>Forma de pagamento:</label><span class="totalNumb txtTitR">Valor pago R$:</span></div>
      <div id="linhaTotal"><label class="tx">Cartão de Débito</label><span class="totalNumb">100,00</span></div>
    </div>
  </div>
  <div data-role="collapsible" id="infos">
    <ul data-role="listview"><li>
      <strong>Modelo: </strong>65 <strong>Série: </strong>1 <strong>Número: </strong>12345
      <strong>Emissão: </strong>${o.issued ?? "18/09/2026 19:05:22-03:00"} - Via Consumidor
    </li></ul>
    <ul data-role="listview"><li><strong>CPF: </strong>123.456.789-09</li></ul>
    <ul data-role="listview"><li><strong>Chave de acesso:</strong><br><span class="chave">${spaced}</span></li></ul>
  </div></div></body></html>`;
}

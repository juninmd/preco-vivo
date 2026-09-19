import { describe, expect, test } from "bun:test";
import { findCandidates, normalize, similarity, sizeOf } from "../src/suggestions/candidates";
import { type Judge, parseVerdicts } from "../src/suggestions/judge";
import { buildNfceHtml, CAFE, makeKey, qrUrl } from "./fixtures/nfce-sp";
import { setup } from "./helpers";

describe("candidate generation", () => {
  test("abbreviated names of the same coffee match", () => {
    expect(similarity(["CAFE", "PILAO", "TRAD"], ["CAF", "PILAO", "TRAD"])).toBe(1);
  });
  test("model numbers must match exactly (coffee filter 102 is not 103)", () => {
    const got = findCandidates([
      { id: 1, name: "FILTRO AROMA MAX 103", storeIds: [1] },
      { id: 2, name: "FILTRO AROMA MAX 102", storeIds: [2] },
    ]);
    expect(got).toEqual([]);
  });
  test("package sizes normalize across units", () => {
    expect(sizeOf(normalize("LEITE 1L"))).toBe(sizeOf(normalize("LEITE 1000ML")));
    expect(sizeOf(normalize("ARROZ 5KG"))).toBe("5000G");
  });
  test("different sizes are never paired, same store never paired", () => {
    const got = findCandidates([
      { id: 1, name: "CAFE PILAO 500G", storeIds: [1] },
      { id: 2, name: "CAFE PILAO 250G", storeIds: [2] },
      { id: 3, name: "CAF PILAO 500G", storeIds: [1] },
      { id: 4, name: "CAFE PILAO TRAD 500G", storeIds: [2] },
    ]);
    expect(got.map((c) => [c.a, c.b])).toEqual([
      [1, 4],
      [3, 4],
    ]);
  });
});

describe("AI verdict parsing", () => {
  test("out-of-range and malformed entries are dropped, not trusted", () => {
    const v = parseVerdicts(
      'ok {"results":[{"i":0,"same":true,"reason":"igual"},{"i":7,"same":true},{"i":1,"same":"yes"}]}',
      2,
    );
    expect([...v.keys()]).toEqual([0]);
  });
  test("non-JSON answers are an explicit error", () => {
    expect(() => parseVerdicts("desculpe", 1)).toThrow(/JSON/);
  });
});

const KEY_A = makeKey({ number: "000000010" });
const KEY_B = makeKey({ number: "000000011", cnpj: "98765432000110" });

function twoStores(judge: Judge | null) {
  const pages = new Map([
    [KEY_A, buildNfceHtml({ key: KEY_A })],
    [
      KEY_B,
      buildNfceHtml({
        key: KEY_B,
        cnpj: "98.765.432/0001-10",
        storeName: "ATACADO OUTRO",
        items: [
          {
            ...CAFE,
            name: "CAF PILAO TRAD 500G",
            code: "555",
            qty: "1",
            unitPrice: "19,50",
            total: "19,50",
          },
        ],
        total: "19,50",
        discount: "0,00",
        paid: "19,50",
      }),
    ],
  ]);
  return setup({ pages, judge });
}

describe("merge suggestions flow", () => {
  test("accepting a suggestion joins both stores into one price line", async () => {
    const { call } = twoStores(null);
    await call("POST", "/api/receipts", { url: qrUrl(KEY_A) });
    await call("POST", "/api/receipts", { url: qrUrl(KEY_B) });

    expect((await call("POST", "/api/suggestions/refresh")).body).toEqual({ created: 1 });
    const [s] = (await call("GET", "/api/suggestions")).body.items;
    expect([s.nameA, s.nameB]).toEqual(["CAFE PILAO TRAD 500G", "CAF PILAO TRAD 500G"]);

    expect((await call("POST", `/api/suggestions/${s.id}/accept`)).status).toBe(204);
    const detail = (await call("GET", `/api/products/${s.a}`)).body;
    expect(detail.points.map((p: { storeName: string }) => p.storeName)).toEqual([
      "SUPERMERCADO EXEMPLO LTDA",
      "ATACADO OUTRO",
    ]);
    expect((await call("GET", `/api/products/${s.b}`)).status).toBe(404);
    expect((await call("POST", `/api/suggestions/${s.id}/accept`)).status).toBe(404);
  });

  test("pairs the AI rejects are remembered and never sent again", async () => {
    let calls = 0;
    const judge: Judge = async (pairs) => {
      calls += pairs.length;
      return new Map(pairs.map((_, i) => [i, { same: false, reason: "sabores diferentes" }]));
    };
    const { call } = twoStores(judge);
    await call("POST", "/api/receipts", { url: qrUrl(KEY_A) });
    await call("POST", "/api/receipts", { url: qrUrl(KEY_B) });
    expect((await call("POST", "/api/suggestions/refresh")).body).toEqual({ created: 0 });
    await call("POST", "/api/suggestions/refresh");
    expect(calls).toBe(1);
    expect((await call("GET", "/api/suggestions")).body.items).toHaveLength(0);
  });
});

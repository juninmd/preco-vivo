import { describe, expect, test } from "bun:test";
import { buildNfceHtml, type FixtureItem, makeKey, qrUrl } from "./fixtures/nfce-sp";
import { setup } from "./helpers";

const kinder = (qty: string, unit: string, unitPrice: string, total: string): FixtureItem => ({
  name: "KINDER RECH 6X12,5GR CHOCOLATE",
  code: "1290233",
  qty,
  unit,
  unitPrice,
  total,
});

const K1 = makeKey({ number: "000000501" });
const K2 = makeKey({ number: "000000502" });
const K3 = makeKey({ number: "000000503" });

function wholesaleShopping() {
  const pages = new Map([
    [
      K1,
      buildNfceHtml({
        key: K1,
        issued: "03/09/2026 14:05:36",
        items: [
          kinder("10", "PC", "13,99", "139,90"),
          kinder("12", "PC", "13,99", "167,88"),
          kinder("3", "DP", "139,90", "419,70"),
        ],
        noDiscountRows: true,
        paid: "727,48",
      }),
    ],
    [
      K2,
      buildNfceHtml({
        key: K2,
        issued: "10/09/2026 09:00:00",
        items: [kinder("5", "PC", "14,49", "72,45")],
        noDiscountRows: true,
        paid: "72,45",
      }),
    ],
    [
      K3,
      buildNfceHtml({
        key: K3,
        issued: "17/09/2026 09:00:00",
        items: [kinder("2", "PC", "10,00", "20,00"), kinder("1", "PC", "13,00", "13,00")],
        noDiscountRows: true,
        paid: "33,00",
      }),
    ],
  ]);
  return setup({ pages });
}

async function importAll(call: ReturnType<typeof setup>["call"], keys: string[]) {
  for (const k of keys) expect((await call("POST", "/api/receipts", { url: qrUrl(k) })).status).toBe(201);
}

describe("price lines with real wholesale receipts", () => {
  test("a unit sold also by the display box does not show a fake +900% variation", async () => {
    const { call } = wholesaleShopping();
    await importAll(call, [K1, K2]);
    const [p] = (await call("GET", "/api/products?sort=variation")).body.items;
    expect(p).toMatchObject({ unit: "PC", purchases: 2, firstCents: 1399, lastCents: 1449, units: 2 });
  });

  test("when the latest receipt has two units, the line follows the one bought in larger quantity", async () => {
    const { call } = wholesaleShopping();
    await importAll(call, [K1]);
    const [p] = (await call("GET", "/api/products")).body.items;
    expect(p).toMatchObject({ unit: "PC", lastCents: 1399, units: 2 });
  });

  test("several lines of the same product in one receipt become one point per unit", async () => {
    const { call } = wholesaleShopping();
    await importAll(call, [K1, K2]);
    const { id } = (await call("GET", "/api/products")).body.items[0];
    const points = (await call("GET", `/api/products/${id}`)).body.points;
    expect(
      points.map((x: { unit: string; unitPriceCents: number; qty: number }) => [x.unit, x.unitPriceCents, x.qty]),
    ).toEqual([
      ["PC", 1399, 22],
      ["DP", 13990, 3],
      ["PC", 1449, 5],
    ]);
  });

  test("the receipt point uses the quantity-weighted average price", async () => {
    const { call } = wholesaleShopping();
    await importAll(call, [K3]);
    const { id } = (await call("GET", "/api/products")).body.items[0];
    const [point] = (await call("GET", `/api/products/${id}`)).body.points;
    expect([point.unitPriceCents, point.qty]).toEqual([1100, 3]);
  });
});

import { describe, expect, test } from "bun:test";
import { buildNfceHtml, CAFE, LEITE, makeKey, qrUrl } from "./fixtures/nfce-sp";
import { setup } from "./helpers";

const KEY1 = makeKey({ number: "000000001" });
const KEY2 = makeKey({ number: "000000002", yymm: "2610" });

function twoWeeksOfShopping() {
  const pages = new Map([
    [KEY1, buildNfceHtml({ key: KEY1 })],
    [
      KEY2,
      buildNfceHtml({
        key: KEY2,
        issued: "02/10/2026 10:00:00-03:00",
        items: [
          { ...CAFE, qty: "1", unitPrice: "21,90", total: "21,90" },
          { ...LEITE, qty: "1", unitPrice: "4,59", total: "4,59" },
        ],
        total: "26,49",
        discount: "0,00",
        paid: "26,49",
      }),
    ],
  ]);
  return setup({ pages });
}

describe("auth", () => {
  test("health is public so probes work without the token", async () => {
    const { app } = setup();
    expect((await app.request("/health")).status).toBe(200);
  });
  test("api refuses missing or wrong tokens", async () => {
    const { call } = setup();
    expect((await call("GET", "/api/products", undefined, "")).status).toBe(401);
    expect((await call("GET", "/api/products", undefined, "x".repeat(27))).status).toBe(401);
  });
});

describe("importing receipts", () => {
  test("re-scanning the same QR does not duplicate prices nor hit SEFAZ again", async () => {
    const { call, fetched } = twoWeeksOfShopping();
    const first = await call("POST", "/api/receipts", { url: qrUrl(KEY1) });
    expect(first.status).toBe(201);
    expect(first.body.receipt).toMatchObject({
      storeName: "SUPERMERCADO EXEMPLO LTDA",
      itemCount: 3,
      paidCents: 10000,
    });
    const again = await call("POST", "/api/receipts", { url: qrUrl(KEY1) });
    expect([again.status, again.body.created]).toEqual([200, false]);
    expect(fetched).toHaveLength(1);
  });

  test("two concurrent scans of the same receipt store it once", async () => {
    const { call, db } = twoWeeksOfShopping();
    const results = await Promise.all([1, 2].map(() => call("POST", "/api/receipts", { url: qrUrl(KEY1) })));
    expect(results.map((r) => r.body.created).sort()).toEqual([false, true]);
    expect(db.query("SELECT COUNT(*) AS n FROM receipt_items").get()).toEqual({ n: 3 });
  });

  test("a SEFAZ error page is reported and stores nothing", async () => {
    const { call, db } = setup();
    const res = await call("POST", "/api/receipts", { url: qrUrl(KEY1) });
    expect(res.status).toBe(422);
    expect(db.query("SELECT COUNT(*) AS n FROM receipts").get()).toEqual({ n: 0 });
  });

  test("non-SP urls are rejected before any outbound request", async () => {
    const { call, fetched } = setup();
    const res = await call("POST", "/api/receipts", { url: "http://127.0.0.1:8080/qrcode?p=1" });
    expect(res.status).toBe(422);
    expect(fetched).toHaveLength(0);
  });
});

describe("price history", () => {
  test("same store code across receipts builds one product line, oldest first", async () => {
    const { call } = twoWeeksOfShopping();
    await call("POST", "/api/receipts", { url: qrUrl(KEY2) });
    await call("POST", "/api/receipts", { url: qrUrl(KEY1) });

    const list = await call("GET", "/api/products?sort=variation");
    expect(list.body.items).toHaveLength(3);
    const [top] = list.body.items;
    expect(top).toMatchObject({ name: "CAFE PILAO TRAD 500G", purchases: 2, firstCents: 1890, lastCents: 2190 });

    const detail = await call("GET", `/api/products/${top.id}`);
    expect(detail.body.points.map((p: { unitPriceCents: number }) => p.unitPriceCents)).toEqual([1890, 2190]);
  });

  test("search treats LIKE wildcards literally", async () => {
    const { call } = twoWeeksOfShopping();
    await call("POST", "/api/receipts", { url: qrUrl(KEY1) });
    expect((await call("GET", "/api/products?q=%25")).body.items).toHaveLength(0);
    expect((await call("GET", "/api/products?q=pilao")).body.items).toHaveLength(1);
  });

  test("list pagination is bounded", async () => {
    const { call } = setup();
    expect((await call("GET", "/api/products?limit=500")).status).toBe(400);
    expect((await call("GET", "/api/products?sort=drop")).status).toBe(400);
  });

  test("rename and self-merge validation", async () => {
    const { call } = twoWeeksOfShopping();
    await call("POST", "/api/receipts", { url: qrUrl(KEY1) });
    const { body } = await call("GET", "/api/products?sort=name");
    const id = body.items[0].id;
    expect((await call("PATCH", `/api/products/${id}`, { name: "Banana nanica" })).body.name).toBe("Banana nanica");
    expect((await call("POST", `/api/products/${id}/merge`, { sourceIds: [id] })).status).toBe(400);
    expect((await call("GET", "/api/products/999")).status).toBe(404);
  });
});

import { describe, expect, test } from "bun:test";
import { isValidAccessKey } from "../src/nfce/access-key";
import { parseBrDecimal, parseBrlToCents } from "../src/nfce/money";
import { parseNfceHtml } from "../src/nfce/parse";
import { parseNfceInput } from "../src/nfce/url";
import { buildNfceHtml, DEFAULT_ITEMS, makeKey, qrUrl } from "./fixtures/nfce-sp";

describe("BRL numbers", () => {
  test("thousand separators do not truncate large amounts", () => {
    expect(parseBrlToCents("1.234.567,89")).toBe(123456789);
    expect(parseBrlToCents("R$ 1.234,56")).toBe(123456);
  });
  test("weighed quantities keep three decimals", () => {
    expect(parseBrDecimal("0,532")).toBe(0.532);
  });
  test("garbage is rejected instead of becoming zero", () => {
    expect(() => parseBrlToCents("")).toThrow();
    expect(() => parseBrlToCents("12,34,56")).toThrow();
  });
});

describe("QR input", () => {
  const key = makeKey();
  test("check digit catches a single mistyped digit", () => {
    expect(isValidAccessKey(key)).toBe(true);
    const typo = key.slice(0, 10) + ((Number(key[10]) + 1) % 10) + key.slice(11);
    expect(isValidAccessKey(typo)).toBe(false);
  });
  test("http short QR url is normalized to the canonical https consulta", () => {
    const ref = parseNfceInput(`  ${qrUrl(key)}  `);
    expect(ref.accessKey).toBe(key);
    expect(ref.url.startsWith("https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/")).toBe(true);
  });
  test("foreign hosts are refused so the server cannot be used as a proxy (SSRF)", () => {
    expect(() => parseNfceInput(qrUrl(key, "169.254.169.254"))).toThrow(/SP/);
    expect(() => parseNfceInput(qrUrl(key, "nfce.fazenda.sp.gov.br.evil.com"))).toThrow(/SP/);
  });
  test("bare access key explains the captcha limitation", () => {
    expect(() => parseNfceInput(key)).toThrow(/captcha/);
  });
  test("keys from other states or NF-e model 55 are refused", () => {
    expect(() => parseNfceInput(qrUrl(makeKey({ state: "31" })))).toThrow(/SP/);
    expect(() => parseNfceInput(qrUrl(makeKey({ model: "55" })))).toThrow(/SP/);
  });
});

describe("SEFAZ-SP page parser", () => {
  test("reads store, date, totals and every item price", async () => {
    const r = await parseNfceHtml(buildNfceHtml());
    expect(r.accessKey).toBe(makeKey());
    expect(r.store).toEqual({
      cnpj: "12345678000190",
      name: "SUPERMERCADO EXEMPLO LTDA",
      address: "RUA UM, 100, CENTRO, FRANCA, SP",
    });
    expect(r.issuedAt).toBe("2026-09-18T19:05:22-03:00");
    expect([r.totalCents, r.discountCents, r.paidCents]).toEqual([10268, 268, 10000]);
    expect(r.items).toHaveLength(3);
    expect(r.items[0]).toEqual({
      line: 1,
      description: "BANANA NANICA KG",
      code: "2001",
      qty: 1.235,
      unit: "KG",
      unitPriceCents: 599,
      totalCents: 740,
    });
    expect(r.items[1]?.code).toBe("7896089012453");
  });
  test("consumer CPF on the page never leaks into the parsed result", async () => {
    const r = await parseNfceHtml(buildNfceHtml());
    expect(JSON.stringify(r)).not.toContain("123.456.789");
    expect(JSON.stringify(r)).not.toContain("12345678909");
  });
  test("a partially read page is rejected when the item sum misses the total", async () => {
    await expect(parseNfceHtml(buildNfceHtml({ total: "150,00" }))).rejects.toThrow(/soma/);
  });
  test("a truncated item table is rejected by the declared item count", async () => {
    await expect(
      parseNfceHtml(buildNfceHtml({ items: DEFAULT_ITEMS.slice(0, 2), count: "3", total: "45,20" })),
    ).rejects.toThrow(/itens/);
  });
  test("an error page from SEFAZ is a parse error, not an empty receipt", async () => {
    await expect(parseNfceHtml("<html><body>Chave de Acesso do QR Code inválido</body></html>")).rejects.toThrow(
      /nenhum item/,
    );
  });
  test("receipt without discount has only 'Valor a pagar' (real SEFAZ layout)", async () => {
    const r = await parseNfceHtml(buildNfceHtml({ noDiscountRows: true, paid: "102,68" }));
    expect([r.totalCents, r.discountCents, r.paidCents]).toEqual([10268, 0, 10268]);
  });
  test("without discount rows, a paid amount that misses the item sum is still rejected", async () => {
    await expect(parseNfceHtml(buildNfceHtml({ noDiscountRows: true, paid: "99,00" }))).rejects.toThrow(/soma/);
  });
  test("date without seconds is still accepted", async () => {
    const r = await parseNfceHtml(buildNfceHtml({ issued: "01/02/2026 08:15" }));
    expect(r.issuedAt).toBe("2026-02-01T08:15:00-03:00");
  });
  test("address is the block right after the CNPJ, even with extra text blocks around", async () => {
    const html = buildNfceHtml().replace(
      '<div class="txtTopo"',
      '<div class="text">Consulte pela chave</div><div class="txtTopo"',
    );
    const r = await parseNfceHtml(html);
    expect(r.store.address).toBe("RUA UM, 100, CENTRO, FRANCA, SP");
  });
  test("date without explicit offset assumes Brasília time", async () => {
    const r = await parseNfceHtml(buildNfceHtml({ issued: "01/02/2026 08:00:00" }));
    expect(r.issuedAt).toBe("2026-02-01T08:00:00-03:00");
  });
});

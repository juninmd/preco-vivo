import { UserError } from "../errors";

export type FetchHtml = (url: string) => Promise<string>;

type Options = { timeoutMs?: number; maxBytes?: number; fetchImpl?: typeof fetch };

export function createSefazFetcher({
  timeoutMs = 15_000,
  maxBytes = 2_000_000,
  fetchImpl = fetch,
}: Options = {}): FetchHtml {
  return async (url) => {
    let res: Response;
    try {
      res = await fetchImpl(url, {
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { "User-Agent": "Mozilla/5.0 (preco-vivo)", Accept: "text/html" },
      });
    } catch (err) {
      throw new UserError(`SEFAZ-SP não respondeu: ${(err as Error).message}`, 502);
    }
    if (!res.ok) throw new UserError(`SEFAZ-SP respondeu HTTP ${res.status}.`, 502);
    return readCapped(res, maxBytes);
  };
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const decoder = new TextDecoder(charsetOf(res.headers.get("content-type")));
  let size = 0;
  let html = "";
  for await (const chunk of res.body) {
    size += chunk.byteLength;
    if (size > maxBytes) throw new UserError("Resposta da SEFAZ grande demais.", 502);
    html += decoder.decode(chunk, { stream: true });
  }
  return html + decoder.decode();
}

function charsetOf(contentType: string | null): string {
  const charset = /charset=([\w-]+)/i.exec(contentType ?? "")?.[1]?.toLowerCase();
  return charset === "iso-8859-1" || charset === "windows-1252" ? "windows-1252" : "utf-8";
}

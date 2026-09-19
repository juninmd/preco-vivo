import { UserError } from "../errors";
import { accessKeyModel, accessKeyState, isValidAccessKey, NFCE_MODEL } from "./access-key";

const SP_STATE = "35";
const SP_HOSTS = new Set(["www.nfce.fazenda.sp.gov.br", "nfce.fazenda.sp.gov.br"]);
const SP_PATHS = new Set(["/qrcode", "/nfceconsultapublica/paginas/consultaqrcode.aspx"]);
const SP_CANONICAL = "https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx";
const QR_PARAM = /^[0-9A-Za-z|.]{44,300}$/;

export type NfceRef = { accessKey: string; url: string };

export function parseNfceInput(input: string): NfceRef {
  const raw = input.trim();
  if (raw.length === 0 || raw.length > 1000) throw new UserError("Informe a URL do QR code da nota.");
  if (/^[\d\s]{44,60}$/.test(raw)) {
    throw new UserError(
      "A SEFAZ-SP exige captcha para consultar só pela chave. Escaneie o QR code ou cole a URL dele.",
      422,
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UserError("Não parece uma URL de NFC-e.");
  }
  if (!["http:", "https:"].includes(url.protocol) || !SP_HOSTS.has(url.hostname.toLowerCase())) {
    throw new UserError("Por enquanto só notas de SP (nfce.fazenda.sp.gov.br) são suportadas.", 422);
  }
  if (!SP_PATHS.has(url.pathname.toLowerCase())) throw new UserError("URL de NFC-e SP com caminho desconhecido.");

  const p = url.searchParams.get("p") ?? "";
  if (!QR_PARAM.test(p)) throw new UserError("Parâmetro do QR code ausente ou inválido.");
  const accessKey = p.split("|")[0] ?? "";
  if (!isValidAccessKey(accessKey)) throw new UserError("Chave de acesso inválida (dígito verificador).");
  if (accessKeyState(accessKey) !== SP_STATE || accessKeyModel(accessKey) !== NFCE_MODEL) {
    throw new UserError("A chave não é de uma NFC-e de SP.", 422);
  }
  return { accessKey, url: `${SP_CANONICAL}?p=${p}` };
}

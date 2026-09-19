import { type FormEvent, useState } from "react";
import { api, type ReceiptSummary } from "../api";
import { QrScanner } from "../components/QrScanner";
import { day, money } from "../format";

type State =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "done"; receipt: ReceiptSummary; created: boolean }
  | { kind: "error"; message: string };

export function ScanPage() {
  const [camera, setCamera] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = async (value: string) => {
    setCamera(false);
    setState({ kind: "busy" });
    try {
      const { receipt, created } = await api.importReceipt(value);
      setState({ kind: "done", receipt, created });
      setUrl("");
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) void submit(url);
  };

  return (
    <section aria-labelledby="scan-title">
      <h1 id="scan-title">Ler nota</h1>
      <p className="muted">Aponte a câmera para o QR code do cupom (NFC-e de SP).</p>

      {camera ? (
        <>
          <QrScanner onResult={(text) => void submit(text)} />
          <button type="button" className="secondary" onClick={() => setCamera(false)}>
            Fechar câmera
          </button>
        </>
      ) : (
        <button type="button" className="primary big" onClick={() => setCamera(true)} disabled={state.kind === "busy"}>
          Escanear QR code
        </button>
      )}

      <form onSubmit={onSubmit} className="stack">
        <label htmlFor="qr-url">Ou cole a URL do QR code</label>
        <input
          id="qr-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.nfce.fazenda.sp.gov.br/qrcode?p=…"
          autoComplete="off"
        />
        <button type="submit" className="secondary" disabled={!url.trim() || state.kind === "busy"}>
          Importar
        </button>
      </form>

      <div aria-live="polite">
        {state.kind === "busy" && <p className="muted">Consultando a SEFAZ…</p>}
        {state.kind === "error" && (
          <p role="alert" className="error">
            {state.message}
          </p>
        )}
        {state.kind === "done" && (
          <div className="card ok">
            <strong>{state.created ? "Nota importada" : "Essa nota já estava salva"}</strong>
            <p>{state.receipt.storeName}</p>
            <p className="muted">
              {day(state.receipt.issuedAt)} · {state.receipt.itemCount} itens · {money(state.receipt.paidCents)}
            </p>
            <a href="#/products">Ver preços</a>
          </div>
        )}
      </div>
    </section>
  );
}

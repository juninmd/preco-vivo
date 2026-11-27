import { Badge, Button, Card, PageHeader, TextField } from "@juninmd/sonido";
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
    <section>
      <PageHeader
        title="Ler nota"
        titleAs="h1"
        accent
        description="Aponte a câmera para o QR code do cupom (NFC-e de SP)."
      />

      {camera ? (
        <>
          <QrScanner onResult={(text) => void submit(text)} />
          <Button variant="secondary" onClick={() => setCamera(false)}>
            Fechar câmera
          </Button>
        </>
      ) : (
        <Button size="lg" className="big" onClick={() => setCamera(true)} disabled={state.kind === "busy"}>
          Escanear QR code
        </Button>
      )}

      <form onSubmit={onSubmit} className="stack">
        <TextField
          label="Ou cole a URL do QR code"
          id="qr-url"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.nfce.fazenda.sp.gov.br/qrcode?p=…"
          autoComplete="off"
        />
        <Button type="submit" variant="secondary" disabled={!url.trim() || state.kind === "busy"}>
          Importar
        </Button>
      </form>

      <div aria-live="polite">
        {state.kind === "busy" && <p className="muted">Consultando a SEFAZ…</p>}
        {state.kind === "error" && (
          <p role="alert" className="error">
            {state.message}
          </p>
        )}
        {state.kind === "done" && (
          <Card surface="solid" padding="sm" className="card ok">
            <div>
              <Badge tone="success" dot>
                {state.created ? "Nota importada" : "Essa nota já estava salva"}
              </Badge>
            </div>
            <p>{state.receipt.storeName}</p>
            <p className="muted">
              {day(state.receipt.issuedAt)} · {state.receipt.itemCount} itens · {money(state.receipt.paidCents)}
            </p>
            <a href="#/products">Ver preços</a>
          </Card>
        )}
      </div>
    </section>
  );
}

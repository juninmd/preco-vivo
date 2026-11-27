import { Button, PageHeader, TextField } from "@juninmd/sonido";
import { type FormEvent, useState } from "react";
import { api, loadSettings, saveSettings } from "../api";

export function SettingsPage() {
  const [form, setForm] = useState(loadSettings);
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    saveSettings(form);
    try {
      await api.products("", "recent", 0);
      setStatus("Conectado.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  };

  return (
    <section>
      <PageHeader title="Configurações" titleAs="h1" accent />
      <form onSubmit={onSubmit} className="stack">
        <TextField
          label="Endereço do servidor"
          id="base"
          type="url"
          inputMode="url"
          placeholder="vazio = mesmo endereço do site"
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
        />
        <TextField
          label="Token de acesso"
          id="token"
          type="password"
          autoComplete="off"
          value={form.token}
          onChange={(e) => setForm({ ...form, token: e.target.value })}
        />
        <Button type="submit">Salvar e testar</Button>
      </form>
      <p aria-live="polite">{status}</p>
      <p className="muted small">No app Android, use o endereço HTTPS do servidor (ex.: o ingress do cluster).</p>
    </section>
  );
}

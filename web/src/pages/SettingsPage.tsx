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
    <section aria-labelledby="settings-title">
      <h1 id="settings-title">Configurações</h1>
      <form onSubmit={onSubmit} className="stack">
        <label htmlFor="base">Endereço do servidor</label>
        <input
          id="base"
          type="url"
          inputMode="url"
          placeholder="vazio = mesmo endereço do site"
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
        />
        <label htmlFor="token">Token de acesso</label>
        <input
          id="token"
          type="password"
          autoComplete="off"
          value={form.token}
          onChange={(e) => setForm({ ...form, token: e.target.value })}
        />
        <button type="submit" className="primary">
          Salvar e testar
        </button>
      </form>
      <p aria-live="polite">{status}</p>
      <p className="muted small">No app Android, use o endereço HTTPS do servidor (ex.: o ingress do cluster).</p>
    </section>
  );
}

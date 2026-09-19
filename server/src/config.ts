export type Config = {
  port: number;
  dbPath: string;
  apiToken: string;
  corsOrigins: string[];
  webDist: string | null;
  llm: { baseUrl: string; apiKey: string; model: string } | null;
};

export function loadConfig(env: Record<string, string | undefined> = Bun.env): Config {
  const apiToken = env.API_TOKEN ?? "";
  if (apiToken.length < 24) throw new Error("API_TOKEN must be set with at least 24 characters");
  const { LLM_BASE_URL: baseUrl, LLM_API_KEY: apiKey, LLM_MODEL: model } = env;
  return {
    port: Number(env.PORT ?? 3000),
    dbPath: env.DB_PATH ?? "data/preco-vivo.db",
    apiToken,
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:5173,https://localhost,capacitor://localhost")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    webDist: env.WEB_DIST || null,
    llm: baseUrl && apiKey ? { baseUrl, apiKey, model: model || "cloud/llama-8b" } : null,
  };
}

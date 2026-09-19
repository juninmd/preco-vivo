import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { openDb } from "./db/migrate";
import { createSefazFetcher } from "./nfce/fetch";
import { createLlmJudge } from "./suggestions/judge";

const config = loadConfig();
mkdirSync(dirname(config.dbPath), { recursive: true });
const db = openDb(config.dbPath);

const app = createApp({
  db,
  fetchHtml: createSefazFetcher(),
  judge: config.llm ? createLlmJudge(config.llm) : null,
  apiToken: config.apiToken,
  corsOrigins: config.corsOrigins,
  webDist: config.webDist,
});

const server = Bun.serve({ port: config.port, fetch: app.fetch });
console.log(JSON.stringify({ evt: "listening", port: server.port, llm: config.llm?.model ?? null }));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.stop();
    db.close();
    process.exit(0);
  });
}

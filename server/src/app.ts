import type { Database } from "bun:sqlite";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { UserError } from "./errors";
import { bearerAuth } from "./http/auth";
import type { FetchHtml } from "./nfce/fetch";
import { productRoutes } from "./products/routes";
import { receiptRoutes } from "./receipts/routes";
import { createReceiptService } from "./receipts/service";
import type { Judge } from "./suggestions/judge";
import { suggestionRoutes } from "./suggestions/routes";
import { createSuggestionService } from "./suggestions/service";

export type AppDeps = {
  db: Database;
  fetchHtml: FetchHtml;
  judge: Judge | null;
  apiToken: string;
  corsOrigins: string[];
  webDist?: string | null;
};

export function createApp({ db, fetchHtml, judge, apiToken, corsOrigins, webDist }: AppDeps) {
  const app = new Hono();

  app.onError((err, c) => {
    if (err instanceof UserError) return c.json({ error: err.message }, err.status);
    console.error(JSON.stringify({ evt: "unhandled_error", path: c.req.path, message: err.message }));
    return c.json({ error: "Erro interno." }, 500);
  });

  app.get("/health", (c) => {
    db.query("SELECT 1").get();
    return c.json({ status: "ok" });
  });

  app.use("/api/*", cors({ origin: corsOrigins, allowHeaders: ["Authorization", "Content-Type"], maxAge: 600 }));
  app.use("/api/*", bearerAuth(apiToken));
  app.route("/api/receipts", receiptRoutes(createReceiptService(db, fetchHtml)));
  app.route("/api/products", productRoutes(db));
  app.route("/api/suggestions", suggestionRoutes(createSuggestionService(db, judge)));
  app.all("/api/*", (c) => c.json({ error: "Rota não encontrada." }, 404));

  if (webDist) {
    app.use("/*", serveStatic({ root: webDist }));
    app.get("/*", serveStatic({ path: `${webDist}/index.html` }));
  }
  return app;
}

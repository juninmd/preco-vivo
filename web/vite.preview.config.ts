import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Config da página de comparação em docs/sonido-migration. Fica em web/ para
// que vite e @vitejs/plugin-react resolvam a partir do web/node_modules.
const docs = fileURLToPath(new URL("../docs/sonido-migration", import.meta.url));
const repo = fileURLToPath(new URL("..", import.meta.url));
const modules = fileURLToPath(new URL("./node_modules", import.meta.url));

export default defineConfig({
  root: docs,
  plugins: [react()],
  resolve: {
    alias: [
      // O pacote está instalado em web/node_modules (workspace), não na raiz.
      { find: /^@juninmd\/sonido\/styles\.css$/, replacement: `${modules}/@juninmd/sonido/dist/sonido.css` },
      { find: /^@juninmd\/sonido$/, replacement: `${modules}/@juninmd/sonido/dist/index.js` },
      { find: "react-dom/client", replacement: `${modules}/react-dom/client.js` },
      { find: "react-dom", replacement: `${modules}/react-dom` },
      { find: "react/jsx-runtime", replacement: `${modules}/react/jsx-runtime.js` },
      { find: "react", replacement: `${modules}/react` },
    ],
  },
  server: {
    port: 5315,
    strictPort: true,
    fs: { allow: [repo] },
  },
});

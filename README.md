<div align="center">

<img src="web/public/icon-192.png" width="88" alt="Ícone do Preço Vivo" />

# Preço Vivo

**Escaneie o QR code da nota do supermercado e veja o preço de cada produto evoluir ao longo do tempo.**

[![Bun](https://img.shields.io/badge/Bun-1.3-000?logo=bun&logoColor=fff)](https://bun.sh)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=fff)](https://hono.dev)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=000)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=fff)](https://vite.dev)
[![Build](https://img.shields.io/github/actions/workflow/status/juninmd/preco-vivo/validate.yml?branch=main&label=build)](https://github.com/juninmd/preco-vivo/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-0f766e)](LICENSE)

<br/>

<img src=".github/assets/screenshots/home.png" width="260" alt="Tela Produtos com três itens de cupom de exemplo e a variação de preço do café" />

</div>

---

## ✨ O que faz

- 📷 **Lê o QR code da NFC-e** pela câmera, ou pela URL colada, e importa todos os itens do cupom.
- 📈 **Linha de preço por produto**, com mínimo, máximo e variação desde a primeira compra. Um ponto por nota, e unidades diferentes (unidade × caixa) nunca se misturam.
- 🔎 **Ranking de "maior aumento"** para ver onde a inflação da sua cesta está batendo.
- 🧩 **Junta o mesmo produto entre mercados** (`CAFE 3 COR VAC 500G` ≈ `CAFE 3 CORAC 500 GR`): sugestão automática que você confirma, com IA opcional para filtrar os pares.
- 🔁 **Idempotente**: escanear a mesma nota de novo não duplica nada.
- 📱 **PWA instalável**, com modo escuro e leitor de QR que funciona offline (wasm local).

> Homologado contra a SEFAZ-SP real com **14 notas de 2020 a 2026**: supermercados, atacarejo, postos, papelaria e fast-food, nos formatos de QR v2 e v3.

## 📸 Telas

| | |
|:---:|:---:|
| <img src="docs/screenshots/scan.png" width="300" alt="Tela de leitura do QR code" /><br/>**Ler nota**<br/>Escaneie o QR code ou cole a URL do cupom. | <img src="docs/screenshots/products.png" width="300" alt="Lista de produtos com variação de preço" /><br/>**Produtos**<br/>Último preço e variação desde a primeira compra. |
| <img src="docs/screenshots/product.png" width="300" alt="Gráfico da evolução de preço de um produto" /><br/>**Gráfico do produto**<br/>Um ponto por nota, com mínimo e máximo. | <img src="docs/screenshots/product-dark.png" width="300" alt="Gráfico em modo escuro" /><br/>**Modo escuro**<br/>O mesmo gráfico com tema escuro. |
| <img src="docs/screenshots/merge.png" width="300" alt="Sugestão para juntar o mesmo produto de mercados diferentes" /><br/>**Juntar produtos**<br/>Confirme quando nomes de mercados diferentes são o mesmo produto. | |

## 🧠 Como funciona

```mermaid
flowchart LR
    QR["📷 QR da NFC-e"] --> V{"URL da SEFAZ-SP?<br/>chave válida (mod 11)?<br/>nfce/url.ts · access-key.ts"}
    V -- não --> X["422: recusado<br/>(sem requisição)"]
    V -- sim --> F["Consulta pública SEFAZ-SP<br/>nfce/fetch.ts"]
    F --> P["Parser HTMLRewriter<br/>itens · totais · emitente<br/>nfce/parse.ts"]
    P --> C{"soma dos itens = total?<br/>nº de itens confere?<br/>nfce/parse.ts"}
    C -- não --> E["422: nota não gravada"]
    C -- sim --> DB[("SQLite<br/>lojas · notas · produtos<br/>db/migrate.ts")]
    DB --> UI["📈 Linha de preço<br/>por produto<br/>web/src/pages/ProductPage.tsx"]
    DB --> S["🧩 Sugestões de fusão<br/>(+ IA opcional)<br/>suggestions/service.ts · judge.ts"]
```

- **Mesmo código no mesmo mercado = mesmo produto.** Entre mercados, os candidatos saem de tokens do nome, abreviações (`CAF` ≈ `CAFE`) e tamanho da embalagem normalizado (`1L` = `1000ML`). Números de modelo diferentes nunca viram par.
- **Falha alto, nunca pela metade**: se a SEFAZ mudar o layout ou devolver uma página de erro, a importação dá 422 e nada é gravado.

## 📋 Requisitos

- [Bun](https://bun.sh) 1.3 (o `Dockerfile` usa `oven/bun:1.3.13`). Não há Node nem npm no fluxo.
- Docker, só se for usar a imagem.

## 🚀 Começando

```bash
bun install
cp .env.example .env          # defina API_TOKEN (>= 24 caracteres)
bun run dev:server            # API em http://localhost:3000
bun run dev:web               # app em http://localhost:5173 (proxy /api -> :3000)
```

Abra o app, vá em **Config** e cole o `API_TOKEN`. Endereço vazio significa o mesmo host.

<details>
<summary><b>Variáveis de ambiente</b></summary>

| Variável | Padrão | Para quê | Exemplo |
|---|---|---|---|
| `API_TOKEN` | obrigatório | Token Bearer exigido em `/api/*` (mín. 24 caracteres) | `troque-por-um-segredo-com-24-caracteres-ou-mais` |
| `PORT` | `3000` | Porta HTTP | `8080` |
| `DB_PATH` | `data/preco-vivo.db` | Arquivo SQLite (modo WAL) | `/data/preco-vivo.db` |
| `CORS_ORIGINS` | `http://localhost:5173,https://localhost,capacitor://localhost` | Origens liberadas para chamar a API | `https://app.exemplo.com` |
| `WEB_DIST` | vazio | Pasta do build do web para servir junto | `web/dist` |
| `LLM_BASE_URL` | vazio | Gateway compatível com OpenAI (ex.: LiteLLM) para filtrar sugestões; precisa de `LLM_API_KEY` também | `https://llm.exemplo.com/v1` |
| `LLM_API_KEY` | vazio | Chave do gateway acima | `<sua-chave>` |
| `LLM_MODEL` | `cloud/llama-8b` | Modelo pedido ao gateway | `cloud/llama-8b` |

</details>

## 🐳 Docker

```bash
docker build -t preco-vivo .
docker run -p 3000:3000 -e API_TOKEN=... -v preco-vivo-data:/data preco-vivo
```

Imagem de ~70 MB, roda como usuário não-root, tem `HEALTHCHECK` em `GET /health` e serve API e PWA no mesmo endereço. Faça backup do volume `/data`.

## 📱 No celular (PWA)

> [!NOTE]
> Publique atrás de **HTTPS**: a câmera só funciona em contexto seguro.

Para instalar:

- **Android/Chrome**: menu → *Instalar app*
- **iOS/Safari**: Compartilhar → *Adicionar à Tela de Início*

O service worker guarda só o app. Respostas de `/api` nunca vão para o cache.

## 🔌 API

Todas as rotas `/api/*` exigem `Authorization: Bearer <API_TOKEN>`. As listas são paginadas (`limit` ≤ 100, `offset`).

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/receipts` | Importa `{ "url": "<URL do QR>" }` → `201` nova · `200` já existia |
| `GET` | `/api/receipts` | Notas importadas, da mais recente para a mais antiga |
| `GET` | `/api/products?q=&sort=recent\|variation\|name` | Produtos com primeiro/último preço, mínimo e máximo |
| `GET` | `/api/products/:id` | Detalhe com a série de preços e os nomes em cada cupom |
| `PATCH` | `/api/products/:id` | Renomeia `{ "name": "…" }` |
| `POST` | `/api/products/:id/merge` | Junta `{ "sourceIds": [..] }` neste produto |
| `POST` | `/api/suggestions/refresh` | Gera novas sugestões de fusão |
| `GET` | `/api/suggestions` | Sugestões pendentes |
| `POST` | `/api/suggestions/:id/accept` · `/dismiss` | Confirma ou descarta |
| `GET` | `/health` | Health check público |

## 🔒 Segurança e privacidade

- **Anti-SSRF**: só o host `nfce.fazenda.sp.gov.br` é aceito. A URL é reconstruída na forma canônica, redirects não são seguidos e a resposta tem teto de tamanho e de tempo.
- **CPF do consumidor**, quando aparece na página da SEFAZ, nunca é gravado nem logado (há teste para isso).
- Os nomes de produto vão para a IA **como dados, não como instrução**. A saída é validada por esquema, e você confirma toda fusão.
- Token comparado em tempo constante, queries parametrizadas, `ORDER BY` só a partir de uma lista fixa.

## 🧪 Qualidade

```bash
bun run test        # 40 testes: parser, SSRF, idempotência, concorrência, fusão, linhas de preço
bun run typecheck   # tsc do servidor + build do web
bun run lint        # Biome (lint + format)
bun run lint:fix    # corrige o que o Biome aponta
```

## 🚦 Gates de CI

Os workflows em `.github/workflows/` chamam os reusables de `juninmd/base-actions`:

| Workflow | Quando roda | O que checa |
|---|---|---|
| `validate.yml` | PR e push na `main` | Varredura de segredos, `bun install --frozen-lockfile`, `bun run lint` (informativo, não reprova), `bun run test` e auditoria de dependências (reusable `reusable-validate.yml`) |
| `security.yml` | push na `main`, semanal e manual | Varredura de segurança (reusable `reusable-security-scan.yml`) |
| `docker.yml` | push na `main` e manual | Build e push da imagem Docker (reusable `reusable-docker-build.yml`) |

O CI não roda `bun run typecheck` (o raiz não tem script `build`). Rode `bun run lint`, `bun run typecheck` e `bun run test` localmente antes de abrir PR.

## 🤝 Contribuir

- Commits no padrão [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, `ci:`), como no histórico.
- Antes de abrir PR, rode `bun run lint`, `bun run typecheck` e `bun run test`.
- Regras de arquitetura, comandos e o que não fazer estão em [AGENTS.md](AGENTS.md).

## 🗺️ Limitações e próximos passos

- [ ] Só **SP** por enquanto. O layout é compartilhado por outros estados, então dá para expandir a allowlist com homologação.
- [ ] Consultar **só pela chave** exige captcha na SEFAZ-SP, então a entrada é o QR ou a URL dele.
- [ ] A consulta pública **não traz EAN**; o agrupamento usa o código interno de cada mercado.
- [x] Separar a linha de preço quando o mesmo código é vendido em unidades diferentes (ex.: `PC` × caixa `DP`).
- [x] Um ponto por nota quando o mesmo produto aparece em várias linhas do cupom (média ponderada pela quantidade).
- [x] Esconder o gráfico quando só existe uma compra.

## 📁 Estrutura

```
server/   Bun + Hono + bun:sqlite: nfce/ (url, fetch, parse), receipts/, products/, suggestions/
web/      Vite + React PWA: pages/, components/ (QrScanner, PriceChart), public/ (manifest, sw.js)
docs/     screenshots
```

## 📄 Licença

[MIT](LICENSE)

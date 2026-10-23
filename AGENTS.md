# AGENTS.md

Preço Vivo: lê o QR da NFC-e (SEFAZ-SP), grava os itens e mostra a linha de preço por produto. Monorepo Bun com dois workspaces.

## Stack
- `server/`: Bun + Hono + `bun:sqlite` (TypeScript). Módulos: `nfce/` (url, fetch, parse), `receipts/`, `products/`, `suggestions/`.
- `web/`: Vite + React 19 PWA (`pages/`, `components/`).
- Lint e format: Biome (`biome.json`). Gerenciador: Bun (`bun.lock`).

## Comandos (raiz)
- `bun install`
- `bun run dev:server` (API em :3000) e `bun run dev:web` (app em :5173)
- `bun run test` (testes do server, `bun test`)
- `bun run typecheck` (`tsc --noEmit` do server + `tsc -b && vite build` do web)
- `bun run lint` (Biome); `bun run lint:fix` para corrigir

## Configuração
Copie `.env.example` para `.env`. `API_TOKEN` (mín. 24 caracteres) é obrigatório; o resto tem padrão. Nunca commite `.env` nem valores de token.

## Gates de CI
`validate.yml` (PR e main: segredos, install frozen, lint informativo, testes, auditoria; NÃO roda typecheck, rode local), `security.yml` (varredura), `docker.yml` (imagem). Todos usam `juninmd/base-actions`.

## Não fazer
- Não afrouxe a allowlist anti-SSRF (`nfce.fazenda.sp.gov.br`) nem siga redirects na consulta.
- Não grave nem logue o CPF do consumidor.
- Não edite `bun.lock` à mão; regenere com `bun install`.
- Não suprima regra do Biome; corrija.
- Nota inválida ou inconsistente falha com 422 e não grava nada; mantenha esse comportamento.

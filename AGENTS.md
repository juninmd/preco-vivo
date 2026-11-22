# AGENTS.md

Preço Vivo: reads the QR code of an NFC-e (SEFAZ-SP), stores the items, and shows the price line for each product. Bun monorepo with two workspaces.

## Stack

- `server/`: Bun, Hono, `bun:sqlite`, TypeScript. Modules: `nfce/` (url, fetch, parse), `receipts/`, `products/`, `suggestions/`.
- `web/`: Vite and React 19 PWA (`pages/`, `components/`).
- Biome for lint and format (`biome.json`). Bun is the package manager (`bun.lock`).

## Commands

```bash
bun install
bun run dev:server      # API on :3000
bun run dev:web         # app on :5173
bun run test            # server tests (bun test)
bun run typecheck       # tsc --noEmit for server, then vite build for web
bun run lint            # biome check .
bun run lint:fix        # biome check --write .
```

## Structure

- `server/src/nfce/`: URL validation, fetch, and parse of the NFC-e page. `server/src/errors.ts`: error types and HTTP status.
- `server/src/receipts/`, `products/`, `suggestions/`: domain modules.
- `server/test/`: fixtures and tests (`fixtures/nfce-sp.ts`).
- `web/src/pages/`, `web/src/components/`: UI.
- `docs/screenshots/`: README images.

## Configuration

- Copy `.env.example` to `.env`. `API_TOKEN` is required and must be at least 24 characters. The rest has defaults.
- Never commit `.env` or any token value.

## CI

- `validate.yml` (PR and main): secrets check, frozen install, lint (informational), tests, audit. It delegates to `juninmd/base-actions`. The owner's note says it does not run typecheck, so run it locally.
- `security.yml`: scan. `docker.yml`: image build, on push to `main`.

## Gotchas

- Merging to `main` builds and publishes the Docker image (`docker.yml`).
- An invalid or inconsistent receipt fails with 422 and writes nothing. Keep that behavior.

## Do not

- Do not loosen the anti-SSRF allowlist (`nfce.fazenda.sp.gov.br`), and do not follow redirects on the lookup (`fetch.ts` uses `redirect: "error"`).
- Do not store or log the consumer's CPF.
- Do not edit `bun.lock` by hand. Regenerate it with `bun install`.
- Do not suppress a Biome rule. Fix the code.

<!-- base-actions-main-policy -->
## GitHub Actions — padrão obrigatório (@main)

- Referencie as actions internas sempre pelo branch, nunca por SHA:
  - `uses: juninmd/base-actions/<action>@main`
  - `uses: juninmd/base-actions/.github/workflows/<arquivo>.yml@main`
- Não fixe `@<sha>` em `juninmd/base-actions`: a atualização é centralizada no
  `main` e passa a valer no próximo run.
- PRs cujos checks não iniciam por billing/spending limit são mesclados pelo bot central
  `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`.
  Para impedir o merge automático de um PR, aplique a label `do-not-merge`.

# Troca das primitivas locais pelo Sonido

O `web/` mantinha à mão os botões, campos, cartões, tabela e estados vazios que o
[`@juninmd/sonido`](https://github.com/juninmd/sonido) publica. Esta pasta guarda a
comparação lado a lado usada na revisão: o lado **Antes** importa cópias literais de
`origin/main` em `legacy/`; o **Depois** compõe as mesmas telas com as primitivas do
Sonido 2.5.0, usando o CSS real do app.

## Componentes trocados

| Componente | Antes (preco-vivo) | Depois (`@juninmd/sonido`) | Arquivos |
| --- | --- | --- | --- |
| Cabeçalho | `<h1>` solto, com `aria-labelledby` na `<section>` | `PageHeader` com `titleAs="h1"` e `accent` (lavada radial) | `web/src/pages/ProductsPage.tsx`, `ReceiptsPage.tsx`, `ScanPage.tsx`, `SettingsPage.tsx`, `SuggestionsPage.tsx`, `ProductPage.tsx` |
| Busca | `label.sr-only` + `<input type="search">` | `SearchField` (rótulo oculto, limpar e Esc) | `web/src/pages/ProductsPage.tsx` |
| Select | `label.sr-only` + `<select>` | `Select` (`hideLabel`, `<select>` nativo estilizado) | `web/src/pages/ProductsPage.tsx` |
| Botão | `button.primary`, `.secondary`, `.big`, `.link` | `Button` com `variant`, `size`, `loading`, `href` e `aria-busy` | todas as páginas |
| Pílula de tendência | `<span class="trend up/down/flat">` | `Badge` com `tone` semântico (alta = `danger`, queda = `success`, estável = `neutral`) | `web/src/pages/ProductsPage.tsx` |
| Cartão | `<div class="card">` / `<li class="card">` | `Card surface="solid" padding="sm"` (mantém `.card.ok` verde) | `web/src/pages/ScanPage.tsx`, `SuggestionsPage.tsx` |
| Estado vazio | `<p class="muted">` | `EmptyState` com título e descrição | `ProductsPage.tsx`, `ReceiptsPage.tsx`, `SuggestionsPage.tsx` |
| Carregando | `<p role="status">Carregando…</p>` | `Skeleton` (`role="status"` e `aria-busy`) | `ProductsPage.tsx`, `ReceiptsPage.tsx`, `ProductPage.tsx`, `SuggestionsPage.tsx` |
| Campo de texto | `label` + `<input>` | `TextField` (rótulo, hint, erro e `aria-describedby`) | `ScanPage.tsx`, `SettingsPage.tsx`, `ProductPage.tsx` |
| Seletor de unidade | `fieldset.segmented` com `aria-pressed` | `SubTabs` (tablist com foco itinerante) | `web/src/pages/ProductPage.tsx` |
| Tabela de compras | `<table>` escrita à mão | `DataTable` com ordenação por coluna (`aria-sort`) | `web/src/pages/ProductPage.tsx` |
| Pílula de mercado | `<span class="muted small">` | `Badge tone="neutral"` | `web/src/pages/ProductPage.tsx` |

O `Button` cobre todas as ações do app, `TextField` cobre os três formulários e o
`Skeleton` cobre os quatro estados de carregamento. Nenhum teste foi desabilitado.

## Tema e tokens

- `@juninmd/sonido/styles.css` é importado **uma vez** em `web/src/main.tsx`.
- `data-theme` no `<html>` acompanha o `prefers-color-scheme` (`light` / `dark`) e é
  atualizado quando o sistema muda. O app continua claro por padrão e escuro no
  sistema escuro.
- `web/src/sonido.css` é a ponte: mapeia `--sn-color-*`, `--sn-gradient`, `--sn-font`,
  raios e sombras para `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--accent`,
  `--accent-text`, `--error` e `--down`. O accent continua o teal `#0f766e` (claro) e
  `#2dd4bf` (escuro), e o gradiente de ação do Sonido nasce de `var(--accent)` em vez
  do coral padrão.
- A ponte também corrige dois detalhes do encontro com o CSS antigo: o padding do
  `input` global não vaza para o `SearchField`, e o trilho do `SubTabs` ganha contraste
  com o cartão nos dois temas.
- Algumas classes antigas continuam no CSS: `.big` veste o botão de escanear e `.card`
  veste o `Card` e o fallback de uma única compra no `PriceChart`. `.primary`, `.link`,
  `.segmented` e `.title-row` só existem para o lado **Antes** desta pasta; nenhuma tela
  do app as usa depois da migração.

## Capturas

`preview.html` + `preview.tsx` montam a mesma página com os dois lados, usando o CSS
real do app (`index.css` + `components.css` + `sonido.css`) e o `styles.css` instalado
do Sonido. Claro e escuro são determinísticos: o escuro é fixado por `?theme=dark`,
porque no produto ele vem de `prefers-color-scheme`.

```bash
cd web
bunx vite --config vite.preview.config.ts
# http://localhost:5315/preview.html          (tema claro)
# http://localhost:5315/preview.html?theme=dark
node C:/caminho/para/full.cjs "http://localhost:5315/preview.html" "docs/sonido-migration/antes-depois.png"
node C:/caminho/para/full.cjs "http://localhost:5315/preview.html?theme=dark" "docs/sonido-migration/antes-depois-dark.png"
```

As capturas `antes-depois.png` e `antes-depois-dark.png` foram feitas em Chromium
1180×900, `fullPage`, device scale 2, com dados fictícios (nenhum produto, mercado ou
preço real).

## Verificação

```text
bun run lint                         → exit 0 (68 arquivos)
bun run typecheck                    → exit 0 (server tsc + web tsc -b && vite build)
bun run test                         → 46 pass, 0 fail (server)
bun run --cwd web build              → exit 0 (dist/)
```

O baseline foi medido antes da migração, no mesmo checkout: lint, typecheck, test e
build já estavam verdes. Não há falha Windows-only nesta branch. O repositório não tem
testes de `web/`; os 46 testes de `server/` continuam passando, nenhum foi pulado ou
desabilitado.

## O que ficou de fora

- `PriceChart`: o SVG de linha com eixo, mínimo/máximo e resumo acessível não tem
  equivalente no Sonido (`Sparkline` é uma mini-série sem eixo nem `<figcaption>`);
  trocar perderia informação.
- `QrScanner`: câmera, `BarcodeDetector` e fallback `zxing-wasm` continuam locais; o
  Sonido não publica leitor de código.
- Navegação inferior `.tabs`: é um `nav` fixo de PWA com `aria-current="page"`; o
  `NavRail`/`Dock` do Sonido são rails de desktop, não uma barra inferior mobile.
- `Toast`: o app usa `aria-live` inline para o status de importação/sugestões; não há
  toaster global para substituir.

# HookSwap — Atlas Core-Screens Redesign Plan

> Ready-to-execute spec for the full component sweep. Deferred until the account rate limit resets (2026-07-03 ~7:40pm PT) so subagents are available. Screens: **Swap, Explore, Pool, Portfolio + nav.**

## Already done (foundation, committed on `hookswap-rebrand`)
- Brand tokens: accent `#0c8a42`, paper `#f4f5f1`, ink `#0d100c`, danger `#c0291f`, gold `#c79212` (`packages/ui/src/theme/color/colors.ts`).
- Fonts: Inter (UI) + JetBrains Mono registered (`packages/ui/src/theme/fonts.ts`, `apps/web/index.html`).
- Frosted terminal topbar + paper background + brand-leak fixes (`apps/web/index.html`, en-US.json).
- HookSwap wordmark in nav.

## The gap (why it still reads as "green Uniswap")
The defining Atlas traits live in shared components, not CSS. Global CSS can't reach them because number displays are unclassed divs inheriting Inter from `* { font-family: Inter }`.

## Work items (in impact order)

### 1. Mono numbers — HIGHEST IMPACT
Make all prices/amounts/percentages/addresses render in JetBrains Mono (tabular).
- Find the shared numeric/value text path: `packages/ui/src/components/text/Text.tsx` + Tamagui font variants in `fonts.ts`; and Uniswap's value formatters / `<Text variant=...>` used by amount displays.
- Candidates: swap input amount component, `FormattedNumber`/price components in `packages/uniswap/src`, explore table cells, portfolio balances.
- Approach: either (a) add a `mono`/`numeric` Text variant wired to `monospaceFont` and switch number components to it, or (b) make the relevant existing variants use the mono family. Verify: swap `0`s, explore prices, % changes all render mono.

### 2. Receipt / hairline cards
Replace soft shadowed cards with Atlas: `#ffffff`, 14px radius, 1px `rgba(13,16,12,0.09)` border, dashed row dividers; the swap card as the "Launch Receipt" motif (perforated edge, mono rows, barcode footer optional).
- Target the shared Card/Surface components + swap-form container. Tokenize the hairline border on `surface` in the theme so it propagates.

### 3. Hex token containers
Token icons sit in outlined hexagon containers (Atlas signature). Target the shared TokenLogo/`Logo` wrapper.

### 4. Dense terminal tables
Explore/Pool/Portfolio tables: tighter row height, mono numeric columns, uppercase mono column headers with tracking, hairline row dividers.

### 5. Eyebrow labels
Small-caps mono labels with letter-spacing for stat labels ("1D VOLUME", "TOTAL HOOKSWAP TVL").

## Execution approach (after reset)
- One subagent per component area (Text/number, Card, TokenLogo, tables), disjoint files, run in parallel.
- Screenshot-driven: baseline captured (`atlas-swap-1.png`, `atlas-explore-1.png`), iterate each screen.
- Keep the single-green-moment discipline; mono for data, Inter for prose.
- Verify no exhaustive-map / render regressions (all 7 chains still render).

## Baselines captured
`atlas-swap-1.png`, `atlas-explore-1.png`, `baseline-explore.png` (gitignored).

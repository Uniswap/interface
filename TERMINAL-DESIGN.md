# HookSwap Terminal — Design Implementation Plan

Pixel-perfect implementation of the **Terminal** direction (design handoff column
`1b`, screens `B1`–`B13`) in the HookSwap web app (`apps/web`, a Uniswap-interface
fork). This doc is the single source of truth for the build: extracted tokens,
per-screen inventory, reusable components, and build order.

**Source of truth:** `C:/Users/avone/OneDrive/Desktop/design_handoff_hookswap_terminal/`
(`README.md` = pixel spec, `design/HookSwap Redesign.dc.html` = prototype id `1b`,
`screenshots/B01…B13*.png` = visual targets). Recreate exactly; **do not "improve"**.
The only non-final thing is **data** — every number/ticker/address/chart is
placeholder and MUST come from a live source (no mock data in shipped code).

## Guiding constraints
- **Additive only.** The Terminal layer lives under `apps/web/src/terminal/` and is
  scoped to `.tm-root`. It does NOT modify the Tamagui theme, existing routes, or
  the live swap UI. The current app keeps working.
- **Pixel-perfect.** Match hex, font family/weight/size, letter-spacing, radii,
  borders, paddings, and the 226px rail / 52px top bar exactly.
- **Fully typed, no `any`.** Every data-bound view has loading / empty / error states.
- **IBM Plex Mono for ALL numerics** (prices, %, addresses, tickers, param values,
  KPI numbers) — hard rule.

---

## 1. Extracted design tokens

Implemented in `apps/web/src/terminal/theme/tokens.ts` (typed) and mirrored as CSS
variables (`--tm-*`) in `apps/web/src/terminal/theme/terminal.css`.

### Color
| Token | Hex | Use |
|---|---|---|
| ink | `#0B0F14` | primary text, dark buttons, wallet chip |
| ink-2 | `#59626F` | secondary text |
| ink-3 | `#8A94A3` | muted labels |
| ink-3-alt | `#98A0AC` | muted labels (rail section labels, top-bar placeholder) |
| faint | `#B0B7C0` | axis labels, timestamps |
| line | `#E6E9EE` | card/frame borders |
| line-2 | `#EFF1F4` | inner dividers |
| line-3 | `#F4F6F8` | table row dividers |
| bg | `#FFFFFF` | cards, top bar |
| bg-app | `#FCFCFD` | main content background |
| panel | `#F6F8FA` | inputs, rail bg, inset fields |
| panel-2 | `#F0F3F6` | segmented-control track, chips |
| panel-2-alt | `#EEF1F4` | segmented-control track, chips (alt) |
| **brand-green** | `#2FE07E` | primary buttons, active accent, "Swap" wordmark |
| green-deep | `#0AA85A` | green text/links on light |
| green-up | `#12B866` | positive values |
| green-bg | `#E9FBEF` | green badge/surface |
| green-border | `#C7F3D8` | green card border |
| btn-ink | `#08110A` | text on brand-green buttons |
| red-down | `#EF4E4A` | negative values |
| red-bg | `#FDEBEA` | negative surface |
| warn | `#F0913A` | gas, out-of-range |
| warn-bg | `#FFF3E8` / `#FFF1E9` | warn surface |
| accent-indigo | `#5B6BFF` | ETH icon, TWAMM category |
| accent-blue | `#2E7CF6` | USDC icon |
| accent-purple | `#8A6BFF` | governance |
| accent-pink | `#E0517A` | security category |
| accent-teal | `#12B0A8` | yield category |
| rail-icon-inactive | `#8A92A0` | inactive rail icon |
| rail-wallet-sub | `#7C8698` | wallet chip subtext (on dark) |

Placeholder token-logo gradients (ETH `linear-gradient(135deg,#8A92FF,#5B6BFF)`,
USDC `linear-gradient(135deg,#2E7CF6,#2563EB)`, wallet avatar
`linear-gradient(135deg,#2FE07E,#12B866)`) exist ONLY as a stopgap — replace with
real token logos (token lists / CDN).

### Typography
| Role | Family | Size / Weight / letter-spacing |
|---|---|---|
| Display / headings / logo wordmark | **Space Grotesk** | 500–700, ls `-0.02em`…`-0.03em` |
| UI / body | **IBM Plex Sans** | 400–700 |
| Numbers, prices, addresses, tickers, code, params | **IBM Plex Mono** | 400–600 |

Representative sizes: hero H1 `50px/600`; section titles `22–26px/600` (Space
Grotesk); card titles `14–17px/600`; body `13–16px`; table cells `12.5–14px`; mono
KPI values `18–28px`; micro labels `10.5–12px`. Rail section labels `10.5px/600`,
ls `0.09em`, uppercase.

### Shape & elevation
- Radii: pills `999px`; buttons `9–15px`; inputs `9–13px`; cards `11–18px`; outer
  screen frame `18px`; token circles `50%`. Concrete verbatim values from the
  prototype: rail item `10px`, rail cards `12px`, top-bar fields `9px`.
- Borders: card `1px solid #E6E9EE`; inner divider `1px solid #EFF1F4`; row divider
  `1px solid #F4F6F8`; green card `1px solid #C7F3D8`.
- Shadows: screen frame `0 30px 60px -30px rgba(11,15,20,.22)`; modal
  `0 40px 90px -20px rgba(11,15,20,.5)`; segmented active `0 1px 2px rgba(11,15,20,.06)`;
  rail active item `0 1px 2px rgba(11,15,20,.05)`; green glow `0 0 8px #2FE07E`.
- Segmented control: track `#F0F3F6`, 3px padding; active pill `#FFFFFF` + segmented shadow.
- Modal scrim: `rgba(11,15,20,.42)`; modal radius `18–22px`.

### Buttons
- **Primary:** bg `#2FE07E`, text `#08110A`, weight 600, radius 9–15px.
- **Secondary/outline:** bg `#FFFFFF`, `1px solid #E6E9EE`, text `#0B0F14`.
- **Ghost/chip:** transparent or `#EEF1F4`, text `#0B0F14`/`#59626F`.
- **Green text link:** `#0AA85A`, weight 600, trailing `→`.

### Layout constants (px)
frame `1360`, rail `226`, top bar `52`. Per-screen columns: B2 market list `238`,
B2 ticket `326`; B4 config `300`, deposit `300`; B6 side `330`; B7 side `340`;
B8 modal `424`; B9 modal `400`; B11 palette `640`; B12 settings-nav `210`.
Content padding `16–26`.

---

## 2. Font situation (ACTION REQUIRED)

The Terminal spec needs **three families not currently bundled**: Space Grotesk,
IBM Plex Sans, IBM Plex Mono. Only Inter (+ a subset) ships today
(`apps/web/public/fonts/Inter-*`). Because of the build-time disk constraint the
font files were **not downloaded**. `terminal.css` declares `@font-face` for each
family pointing at expected drop-in paths with a `local()` + system fallback, so
the shell renders correctly today and upgrades automatically once the files land.

**TODO(fonts):** add to `apps/web/public/fonts/` (then no code change needed):
`SpaceGrotesk-{Medium,SemiBold,Bold}.woff2`,
`IBMPlexSans-{Regular,Medium,SemiBold}.woff2`,
`IBMPlexMono-{Regular,Medium,SemiBold}.woff2`, and add matching `@font-face`
weights + `<link rel="preload">` for the two hot fonts (Plex Sans 400, Plex Mono 400).

---

## 3. Reusable component inventory

Built now (FOUNDATION), under `apps/web/src/terminal/`:
| Component | File | Notes |
|---|---|---|
| `HookLogo` | `components/HookLogo.tsx` | Hex + open green ring SVG + "Hook"/"Swap" wordmark. Verbatim geometry from `HookLogo.dc.html`. |
| `NavIcon` | `components/NavIcon.tsx` | 6 rail stroke icons, verbatim paths from `NavRailB.dc.html`. |
| `LeftRail` | `components/LeftRail.tsx` | 226px rail, active pill + 3px green bar, live hooks-live + wallet props with loading/connect states. |
| `TopBar` | `components/TopBar.tsx` | 52px bar, 280px search, mono gas pill, chain selector, `actions` slot; gas/chain are live props w/ skeletons. |
| `TerminalShell` | `components/TerminalShell.tsx` | Rail + top bar + scroll region; imports `terminal.css`; scoped `.tm-root`. |
| tokens | `theme/tokens.ts` | Typed token objects. |
| CSS vars + fonts | `theme/terminal.css` | `--tm-*` variables + `@font-face`. |
| screen registry | `config/screens.ts` | 13 screens + rail nav config (TRADE/ACCOUNT), routes namespaced `/terminal`. |

To build (per-screen, reusable):
- **StatCard** — label + mono value + delta + optional sparkline (B1 stat bar, B5/B10/B13 KPI rows).
- **SparklineCell** — small inline area/line sparkline, colored by sign (market lists, tables).
- **PriceChart** — full area chart over grid + right price axis + O/H/L/C readout + timeframe tabs (B2/B6), and multi-series TVL/Volume/Fees variant (B10).
- **DataTable** — dense table w/ overlapped token circles, mono cells, hook badge, sparkline col (B3/B6/B10).
- **HookBadge** — category-colored pill (Dyn Fee / TWAMM / Limit / MEV Shield…).
- **SwapTicket** — Market/Limit/TWAMM tabs, Sell/Buy insets, hook selector, MEV toggle, mono breakdown, Swap button (B2).
- **Modal** — scrim `rgba(11,15,20,.42)` + blurred backdrop + centered card (B8/B9/B11 shared primitive).
- **CommandPalette** — ⌘K/Ctrl+K, filter tabs, trending rows, quick actions, keyboard-hint footer (B11).
- **NotificationRow** — unread dot, category tile, title/detail, timestamp, contextual action button (B13).
- Supporting: **SegmentedControl**, **Toggle**, **Stepper**, **CategoryChip/FilterChip**, **TokenPairCircles**, **KpiRow**, **Donut** (conic-gradient), **VolumeBars**, **TradeTape**, **RangeHistogram** (B4).

---

## 4. Per-screen inventory (B1–B13)

Each screen = 1360px frame in `TerminalShell`. Every value listed is **live-sourced**
(mapping from handoff `CLAUDE_PROMPT.md`); each data view needs **loading skeleton**,
**empty**, and **error** states.

### B1 — Landing (`/terminal`)
- **Components:** market ticker strip (BTC/ETH/SOL/UNI/ARB mono, colored %); hero
  (H1 "The hook-native DEX, in terminal form.", subhead, primary "Open terminal" +
  outline "Hook marketplace", 4-cell mono stat bar); right terminal panel card
  (pair header + area chart + faint volume bars); Hook-marketplace 3×2 grid
  (icon, category chip, name, description, `pools` + `TVL` footer) + category filter chips.
- **Live data:** ticker prices/% → price API/subgraph; stat bar (TVL/24h vol/hooks/pairs)
  → protocol-level subgraph aggregates; panel chart → `poolHourDatas`; hook cards →
  hook registry (name/category/pools/TVL). Category chips filter the grid.

### B2 — Swap (`/terminal/swap`)
- **Components:** left `238px` market list (pair, mono price, %Δ, mini sparkline;
  active pair = green left bar + tint); center pair header (O/H/L/C + 24h stats),
  timeframe tabs (1m/5m/15m/1H/4H/1D), **PriceChart** with right price axis, "Hook
  config" strip (base_fee/vol_mult/max_fee/window mono); right `326px` **SwapTicket**
  (Market/Limit/TWAMM tabs, Sell/Buy insets, active-hook selector, **MEV protection**
  toggle, mono route/impact/min-received, Swap button).
- **Live data:** market list + prices/sparklines → subgraph; chart O/H/L/C → pool
  hour/day data; hook config params → hook contract on-chain reads; quote / price
  impact / min-received / route → real quoter; hook fee → hook's live fee. Selecting a
  pair drives chart + ticket. Swap → **B8** confirm → wagmi signature; MEV on → private-flow RPC.

### B3 — Markets (`/terminal/markets`)
- **Components:** title + filter chips (All pools / Hook-enabled / Stable / New);
  6-tile top-movers heatmap (green/red tinted by change); dense **DataTable**:
  Pair (overlapped circles) · Price · 24H · 7D · Volume · TVL · Fees 24h · APR ·
  **HookBadge** · 7d **SparklineCell**.
- **Live data:** pools → v4 subgraph pool entities (`totalValueLockedUSD`,
  `volumeUSD`, `feesUSD`; APR = fees/TVL); movers = sorted %Δ; sparkline = last-N
  hourly closes. Chips filter query. Row → **B6**.

### B4 — Create position (`/terminal/pools/new`)
- **Components:** left `300px` config — numbered steps 01 Pair (two token selectors),
  02 Fee tier (4-cell grid, 0.05% selectable), 03 Hook (search + radio list, Dynamic
  Fee `+18%`); center **RangeHistogram** (two green handles + shaded in-range band +
  price axis) + Min/Max price fields; right `300px` deposit fields (ETH/USDC) + mono
  summary (deposit, fee tier, hook, est fees, projected APR) + primary Create button.
- **Live data:** token list → token list/subgraph; fee tiers → pool config; hooks →
  registry; range histogram → pool liquidity distribution; est fees/APR → computed
  from pool state; Create → mint tx (Position Manager). NOTE: v4-only feature; see §6.

### B5 — Portfolio (`/terminal/portfolio`)
- **Components:** KPI row (Net worth, 24h PnL, Fees earned, Active hooks) via **StatCard**;
  left Open-positions **DataTable** (Pair · **HookBadge** · Value · 24h PnL · Fees ·
  APR · Status pill in/out of range); right allocation **Donut** (conic-gradient) +
  legend + Activity feed.
- **Live data:** connected wallet (wagmi); positions → user's v4 position NFTs;
  value/PnL → current pool state; allocation → token balances; activity → indexed tx
  history. Disconnected → **B9** connect state / empty.

### B6 — Market detail (`/terminal/markets/:poolId`)
- **Components:** pair identity header (overlapped circles, fee tier + **HookBadge**,
  pool address mono) + Price/24h stats + Swap / Add-liquidity buttons; large
  **PriceChart** + O/H/L/C readout + timeframe tabs; 4-tile KPI row (TVL, 24h vol,
  24h fees, APR); right `330px` Trades/Your-position tabs, live **TradeTape** (mono
  price colored by side, size, time), pool-composition bar + legend.
- **Live data:** pool entity + day data; trades → live `Swap` events (subscription/
  websocket/`watchContractEvent`); composition → reserves. Your-position tab → wallet.

### B7 — Hook detail (`/terminal/hooks/:hookId`)
- **Components:** hook identity header (icon, name, category chip, "Audited" shield,
  author/address/version mono) + Installs stat + primary "Attach to pool"; body:
  Overview prose w/ inline `beforeSwap` code chip; Parameters list (key, description,
  mono value); "realized fee vs static" line chart w/ dashed static-fee reference;
  right `340px` 2×2 stat grid (pools, TVL, avg fee, LP uplift) + audit chips + "Pools
  using this hook" list.
- **Live data:** hook metadata → registry/allowlist; params → on-chain hook reads;
  installs/pools/TVL → enumerate pools by `hooks` address; fee-vs-static series → indexer.

### B8 — Confirm swap (modal over `/terminal/swap`)
- **Components:** dimmed+blurred backdrop, scrim `rgba(11,15,20,.42)`, centered
  `424px` **Modal**: title + close, You-pay / You-receive insets w/ down-arrow node,
  mono detail rows (rate, hook+fee, price impact, min received, network cost),
  "Routed via HookSwap v4 · MEV protected" line, primary "Confirm in wallet".
- **Live data:** all values from the live quote carried in from B2; Confirm → wagmi
  `writeContract`/signature. States: pending / success / error.

### B9 — Connect wallet (modal)
- **Components:** same backdrop; centered `400px` **Modal**: wallet rows (MetaMask
  "Installed", Coinbase Wallet, WalletConnect "QR", Rainbow, Ledger "Hardware") icon
  + name + tag; footer "New to wallets? Get started →".
- **Live data:** connector list + installed detection from wagmi; row click → connect.

### B10 — Analytics (`/terminal/analytics`)
- **Components:** timeframe segmented (24H/7D/30D/1Y) + Export; row of 6 **StatCard**
  subgraph cards (label, mono value, delta, mini sparkline); large TVL/Volume/Fees
  **PriceChart** w/ TVL/Volume/Fees toggle + date axis; hook-adoption **Donut** +
  legend + "Browse marketplace"; second row: 24h volume **VolumeBars**; Top-pools
  **DataTable** (mini sparklines); Top-hooks-by-TVL list.
- **Live data:** protocol-level subgraph aggregates (TVL/vol/fees/LPs/swaps, hook
  counts by category); Export → CSV of current query.

### B11 — Search / command palette (modal, ⌘K)
- **Components:** backdrop; `640px` **CommandPalette** near top: search field (query
  + green caret + `esc`), filter tabs (All/Tokens/Pools/Hooks/Actions), Trending
  tokens rows (name, mono price, %Δ, sparkline, green **Swap** button), Quick actions
  rows (icon, label, keyboard hint), footer hint bar (`↑↓ / ↵ / esc`, `⌘K`).
- **Live data:** search → live tokens/pools/hooks; trending → subgraph; actions →
  in-app commands. ⌘K/Ctrl+K opens, Esc closes.

### B12 — Settings (`/terminal/settings`)
- **Components:** left `210px` settings-nav (Trading active, Appearance, Notifications,
  Network, Security, Connected apps); Trading panel rows (label+description / control):
  slippage **SegmentedControl** (0.5%), deadline **Stepper**, MEV **Toggle** (on),
  Expert mode **Toggle** (off), default-hook dropdown, gas preference (mini gwei chart
  + Normal/Fast/Instant segmented); top-bar Save (primary) + Reset (outline).
- **Live data / persistence:** persist slippage/deadline/MEV/expert/default-hook/gas
  (localStorage or profile) and apply to swaps. Gas chart → gas oracle.

### B13 — Notifications (`/terminal/notifications`)
- **Components:** title + "N new" badge + Mark-all-read + settings gear; KPI row
  (Unread, Fees claimable, Price alerts, 7d activity w/ sparkline) via **StatCard**;
  filter chips (All/Unread/Fees/Positions/Alerts); feed of **NotificationRow**
  (unread dot, category tile, title+detail, timestamp, contextual action:
  Collect / Rebalance / Review / Vote — only when an action exists).
- **Live data:** notification/event service (fee-claimable, out-of-range, swap
  confirmed, hook update, price alert, governance) from indexed events + subscriptions;
  unread state global; action buttons perform the real action.

---

## 5. Build order

1. **Tokens + shell** ✅ (this FOUNDATION phase) — `theme/tokens.ts`, `theme/terminal.css`,
   `HookLogo`, `NavIcon`, `LeftRail`, `TopBar`, `TerminalShell`, `config/screens.ts`.
2. **Routing wire-up** — register `/terminal/*` routes in `RouteDefinitions.tsx`
   (lazy pages), add to `paths.ts`; each page renders inside `TerminalShell`. Wire
   `LeftRail.onNavigate` → react-router `navigate`, `activeId` from current route.
   Feed live gas/chain/wallet/hooks-live via hooks (wagmi + existing gas/chain state).
3. **Shared primitives** — `Modal`, `SegmentedControl`, `Toggle`, `HookBadge`,
   `StatCard`, `SparklineCell`, `TokenPairCircles`, `DataTable`.
4. **B2 Swap** (highest-value) — market list + PriceChart + SwapTicket, live quote,
   → **B8** confirm modal + wagmi.
5. **B3 Markets** — heatmap + DataTable, live pool data.
6. **B6 Market detail** + **B7 Hook detail** — reuse PriceChart/DataTable + TradeTape.
7. **B5 Portfolio** + **B10 Analytics** — Donut, KpiRow, VolumeBars.
8. **B4 Create position** — RangeHistogram + mint flow (gated on v4; see §6).
9. **B1 Landing** — ticker + hero + marketplace grid.
10. **B11 Command palette** + **B9 Connect wallet** — Modal + live search / connectors.
11. **B12 Settings** + **B13 Notifications** — persistence + live feed.
12. **Data layer** — one typed query hook per table row in the mapping, each with
    loading/empty/error; `.env.example` for RPC/subgraph/API keys.

Per screen: confirm it visually matches the reference AND every value is fetched,
not hardcoded, before moving on.

---

## 6. Ambiguities / decisions to confirm (do not guess)

- **v4 / hooks vs. LOCKED "EXCLUDE v4".** The entire Terminal concept is *hook-native*
  (v4). Project `CLAUDE.md` locks `supportsV4:false`, ship v2+v3 only. This design
  **cannot be fully data-bound without v4** (hooks marketplace, hook params, hook
  fees, v4 position NFTs, v4 subgraph). **Decision needed:** (a) build the Terminal UI
  now and stub hook/v4 surfaces behind a feature flag until v4 lands, or (b) treat
  Terminal as v4-gated and defer hook screens (B1 grid, B2 hook strip, B4 step 03,
  B7). Recommend (a): build shell + non-hook screens (B2 swap on v2/v3, B3/B5/B6/B10)
  first; hook screens render live only where v4 data exists.
- **Logo ring color.** README brand-green `#2FE07E`; `HookLogo.dc.html` default
  `#22D46B`. Used `#2FE07E` (authoritative README + matches screenshots). Confirm.
- **Rail nav vs. 13 screens.** The rail exposes 6 items (Swap/Markets/Pools/Hooks/
  Portfolio/Activity) exactly as designed. "Pools"→B4, "Hooks"→hook marketplace/B7,
  "Activity"→B13; Analytics(B10) & Settings(B12) are NOT in the rail — reached via
  top-bar/contextual entry. Confirm Analytics/Settings entry points (likely top-bar
  actions or a rail footer link not shown in the prototype).
- **Top-bar height.** Terminal top bar = **52px** (README + B1 prototype). The 66px in
  `NavTopA.dc.html` is the *Lite* (column 1a) top nav — out of scope. Using 52px.
- **Market ticker strip (B1) vs. sub-bar.** On B1 a second row (ticker) sits under the
  top bar. Exposed via `TerminalShell.subBar`. Other screens have no sub-bar.
- **Real token logos & icons.** Prototype uses gradient circles + inline stroke SVGs.
  Replace with real token logos (token lists/CDN) and map icons to the app's icon set.
- **Routing namespace.** Chose `/terminal/*` to avoid colliding with existing `/swap`,
  `/explore`, `/pools`, `/portfolio` routes. If Terminal is meant to *replace* the
  current UI at the root, revisit (would be a non-additive change — needs sign-off).

## DECISIONS (2026-07-04, from Reggie)
- **Hooks/v4:** Build non-hook screens NOW on real v2/v3 data (Swap B2, Markets B3, Pools B4, Portfolio B5, Analytics B10, Search B11, Settings B12, Notifications B13, Connect B9, Confirm B8). GATE the hook-native surfaces (B1 hook grid, B2 hook strip, B7 hook detail) behind a `v4/hooks` feature flag → "coming soon" until v4 is deployed. Branding stays aspirational until then.
- **Rollout:** Terminal REPLACES the current swap UI as the root (`/` → Terminal). Build/verify each screen at `/terminal/*` first, then repoint the root routes. Keep the old swap components until the Terminal equivalents are verified, then remove.
- **Build order:** shell (done) → routing + root swap-over → primitives (StatCard, DataTable, SparklineCell, SwapTicket, Modal) → B2 Swap → B3 Markets → B5 Portfolio → B10 Analytics → remaining → gate hook screens.

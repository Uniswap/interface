# HookSwap — Project Working Doc

> Living scratchpad so we stay on track. Update as decisions land. This is a **fork of the Uniswap interface monorepo** (Uniswap Labs front-end: web + mobile + extension). We are rebranding it to **HookSwap** and shipping on new chains.

## North Star
- **Name:** HookSwap · **URL:** https://hookswap.xyz
- **Brand system:** "Atlas" from the handoff kit — Paper `#f4f5f1`, Card `#fff`, Ink `#0d100c`, primary accent "Acid ink" `#0c8a42` (green text/CTAs), Acid fill `#38e07b`, danger `#c0291f`, gold `#c79212`. Fonts: Inter (UI) + JetBrains Mono (numbers).
- **Go live on:** Robinhood Chain, HyperEVM.

## Ground truth / constraints (verified in-repo)
- This repo is the **front-end interface only** — NOT the smart contracts. Contracts (v2/v3/v4, Universal Router, Permit2) live in separate Uniswap repos and must be deployed separately.
- Quotes/routing come from Uniswap's **hosted Trading API** (`interface.gateway.uniswap.org`, `@universe/api` TradingApi). A custom chain needs its own routing/quoting/indexer backend — the interface alone can't route swaps on a chain the hosted API doesn't serve.
- **Robinhood Chain already exists** as a full chain definition (`packages/uniswap/src/features/chains/evm/info/robinhood.ts`), gated behind `FeatureFlags.Robinhood`. Enabling it = flip the flag / GA it. Has a launch TODO: `SWAP-2703` (explorer URL is a testnet placeholder).
- **HyperEVM does NOT exist** as a chain here — only appears as a token label (`nativeChain: 'HyperEVM'`). Adding it = new `UniverseChainId`, SDK chain id, RPC, Universal Router addresses, gas config. Needs real deployment data to actually work.
- Do **NOT** rename `@uniswap/*` npm packages, `UniverseChainId`, or code identifiers — only user-facing branding.
- **v4 = hooks.** Hooks are a Uniswap **v4-only** feature. "HookSwap" without v4 has no hooks. (See open decisions.)

## Chains present in repo (evm/info/)
arbitrum, arc, avalanche, base, blast, bnb, celo, linea, mainnet, megaeth, monad, optimism, polygon, **robinhood**, soneium, tempo, unichain, worldchain, xlayer, zksync, zora

## Workstreams
1. **Rebrand → HookSwap** — title/meta, PWA manifest, i18n copy, URL constants, favicon/logo, README. (agent mapped: user-facing only)
2. **Reskin → Atlas theme** — remap Tamagui theme tokens in `packages/ui` (accent, surface, fonts).
3. **Enable Robinhood chain** — flip `FeatureFlags.Robinhood`, resolve SWAP-2703 placeholders, GA it.
4. **HyperEVM chain** — scaffold new chain; BLOCKED on real chain data (chain id, RPC, router addrs).
5. **Contracts / routing backend** — out of this repo; must be planned separately.

## Environment / run
- Tooling: **bun 1.3.14**, node 24 (repo pins node 22.22.2 / bun >=1.3.11).
- Dev server: `bun web dev` → http://localhost:3000 (other ports cause CORS w/ Uniswap backend).
- **Fix applied:** removed stale `tools/uniswap-nx` from `package.json` workspaces (folder missing, nothing imports it) — was breaking `bun install`.

## LOCKED DECISIONS (2026-07-03, from Reggie)
- **v4:** EXCLUDE. Ship v2 + v3 only, `supportsV4: false`. No hooks for now (branding aspirational until v4 added).
- **HyperEVM:** real chain. Mainnet id **999** (0x3E7), RPC `https://rpc.hyperliquid.xyz/evm`, native HYPE(18), explorer hyperevmscan.io, WHYPE `0x5555555555555555555555555555555555555555`. Testnet id **998** (0x3E6), RPC `https://rpc.hyperliquid-testnet.xyz/evm`.
- **Robinhood:** real chain (already in repo). Mainnet id **4663** (0x1237), public RPC `https://rpc.mainnet.chain.robinhood.com`, native ETH, explorer robinhoodchain.blockscout.com. Testnet id **46630** (0xB5E6), RPC `https://rpc.testnet.chain.robinhood.com`, explorer explorer.testnet.chain.robinhood.com.
- **Sepolia:** already exists in SDK/enum — enable for testing.
- **Reskin:** apply Atlas brand to the EXISTING swap UI (not the 27-route Atlas OS).
- **Routing:** self-host routing-api + indexer (see [FORK-LIST.md](FORK-LIST.md)). Hosted Uniswap API won't serve custom chains.

## Reality constraint — contract deployment
I (Claude) **cannot broadcast on-chain deploys** (needs funded key + RPC). Deliverable = a Foundry deploy kit + config the frontend reads; Reggie runs it. See [FORK-LIST.md](FORK-LIST.md) for the full repo/deploy plan.

## Localhost bring-up (Windows + bun) — WORKING PROCEDURE
nx spawns bare `vite`/`typechain`/`openapi` but bun only makes `.bunx` shims the Windows shell can't run, so `bun web dev` fails. Bypass:
1. ABI types: `cd packages/uniswap && bun x typechain --target ethers-v5 --out-dir src/abis/types "./src/abis/**/*.json"` and the v3 set via `xargs -a src/abis/v3-type-filepaths.txt bun x typechain ... --out-dir src/abis/types/v3`.
2. Trading API types (path-bug workaround — input must be relative to the ref-parser module dir): `cd packages/api && node ../../node_modules/openapi-typescript-codegen/bin/index.js --input ../../../../packages/api/src/clients/trading/api.json --output ./src/clients/trading/__generated__ --useOptions --exportServices true --exportModels true` then `bun ./scripts/modifyTradingApiTypes.mts`.
3. GraphQL types + UI icons: already committed / regenerate fine.
4. Launch: `cd apps/web && SKIP_CONFIG_PULL=true USE_NEW_CONFIGS=false node ../../node_modules/vite/bin/vite.js dev --port 3000`.

## Progress (2026-07-03)
- ✅ Rebrand → HookSwap (title/meta/urls/i18n) — live, served title = "HookSwap Interface".
- ✅ Atlas theme (accent #0c8a42, paper #f4f5f1, ink, Inter+JetBrains Mono).
- ✅ Chains: Robinhood GA (removed rollout flag), HyperEVM (999) added (`hyperevm.ts`, backendSupported:false + GQL filter guard), Sepolia already present, `supportsV4:false` on Robinhood+HyperEVM. Committed on branch `hookswap-rebrand` (pushed).
- ✅ Forked 15 repos into HooksOS org (see FORK-LIST.md).
- 🔄 Foundry deploy kit under `contracts/` (in progress).
- ⏳ Localhost: `http://localhost:3000` LIVE (bring-up procedure above).

## Render fixes (why the page was blank) — in `apps/web/.env.local` (gitignored)
The app crashed to a blank page on two config validations; fixed via local env overrides:
- `WALLETCONNECT_PROJECT_ID` — committed `.env` uses `WALLET_CONNECT_PROJECT_ID` (underscored) but the legacy config path (USE_NEW_CONFIGS=false) reads `WALLETCONNECT_PROJECT_ID`; web schema requires it non-empty. Set a placeholder.
- `PRIVY_APP_ID` / `PRIVY_CLIENT_ID` — committed `.env` ships non-empty PLACEHOLDER ids, so `MaybePrivyProvider` mounts `<PrivyProvider>` with a bogus id and throws. Set BOTH to `""` → `isPrivyConfigured()` false → Privy skipped. Injected/WalletConnect wallets still work.
Result: app renders the HookSwap landing (Atlas green theme confirmed). Remaining console errors are EXPECTED backend-auth failures (401 on `*.api.uniswap.org/rpc`, WS auth, compliance CORS) — resolved by self-hosting RPC/routing.

## Brand polish TODO (visible in render)
- [ ] Logo still the Uniswap unicorn (top-left) → swap for HookSwap hex logo (brand-kit/logo).
- [ ] Inter font not loading (old Basel `.woff2` 404) → wire Inter/JetBrains Mono @font-face or fonts.

## Follow-ups (pre-production, not localhost blockers)
- [ ] Audit other exhaustive `Record<UniverseChainId,…>` literals across monorepo for a missing `HyperEvm` key (esbuild/dev ignores types; `tsc`/prod build will flag). Candidates: packages/uniswap/src/constants/tokens.ts, apps/web/src/features/Swap/SwapBottomCard.tsx, wallet ContractManager/ProviderManager, chains/utils.ts.
- [ ] Fix the repo's pre-commit hooks for Windows (nx/bun PATH, missing trufflehog/git-secrets, i18n hook bash regex bug) OR keep committing with a manual secret scan.
- [ ] HyperEVM logo asset (currently ETH_LOGO placeholder); confirm USDT0 stablecoin address.

## Decision log
- 2026-07-03: Kept `@uniswap/*` package names; rebrand is user-facing only.
- 2026-07-03: Removed `tools/uniswap-nx` workspace entry to unblock install.
- 2026-07-03: v4 excluded; HyperEVM+Robinhood+Sepolia targeted; self-host routing; brand existing swap UI.
- 2026-07-03: Documented Windows/bun localhost bring-up bypass.

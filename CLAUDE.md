# HookSwap — Project Working Doc

> Living scratchpad so we stay on track. Update as decisions land. This is a **fork of the Uniswap interface monorepo** (Uniswap Labs front-end: web + mobile + extension). We are rebranding it to **HookSwap** and shipping on new chains.

## ⛔ MANDATORY WORKING RULE — FACTS ONLY, NEVER GUESS (from Reggie, indefinite)
- **Do not guess, infer, assume, or say "probably/likely/should be."** Every claim about the code, data, routing, deploys, or state MUST be verified by reading the actual file/route/query/output FIRST, then stated as a fact with the source.
- If something is not yet verified, say **"not verified yet"** and go verify it — do not fill the gap with a plausible-sounding answer.
- This applies to status reports, "what's built", data sources (real vs mock), addresses, and every recommendation. No exceptions. This rule is permanent.

## North Star
- **Name:** HookSwap · **URL:** https://hookswap.org
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

## Sepolia validation results (2026-07-03)
- On-chain audit: Sepolia has the FULL canonical Uniswap stack + is already wired in sdk-core → no deploy. Permit2 + CREATE2 deployer exist on all 3 chains; HyperEVM WHYPE exists.
- Live-app validation caught + fixed 2 real runtime crashes (esbuild skips the exhaustive-map types tsc would catch): `SwapBottomCard` CHAIN_THEME map + `WRAPPED_NATIVE_CURRENCY` missing HyperEvm. `/swap?chain=hyperevm` now renders.
- routing-api scaffolded + pushed to HooksOS/routing-api (chains wired, static on-chain pools, hookswap/ docs). AWS-Lambda/CDK app (no local server).
- **Quoting gap (honest):** interface speaks the Trading API schema, NOT routing-api directly. To quote you need: deploy v2/v3/UR on 999+4663 → fill addresses in sdks + SOR forks → add 3 chains to the SOR fork too → dependency override (@uniswap/* → HooksOS forks) → on-chain liquidity → a Trading API layer (unified-routing-api) or adapter wrapping routing-api.

## Brand polish TODO (visible in render)
- [ ] Logo still the Uniswap unicorn (top-left) → swap for HookSwap hex logo (brand-kit/logo).
- [ ] Inter font not loading (old Basel `.woff2` 404) → wire Inter/JetBrains Mono @font-face or fonts.

## Follow-ups (pre-production, not localhost blockers)
- [ ] Audit other exhaustive `Record<UniverseChainId,…>` literals across monorepo for a missing `HyperEvm` key (esbuild/dev ignores types; `tsc`/prod build will flag). Candidates: packages/uniswap/src/constants/tokens.ts, apps/web/src/features/Swap/SwapBottomCard.tsx, wallet ContractManager/ProviderManager, chains/utils.ts.
- [ ] Fix the repo's pre-commit hooks for Windows (nx/bun PATH, missing trufflehog/git-secrets, i18n hook bash regex bug) OR keep committing with a manual secret scan.
- [ ] HyperEVM logo asset (currently ETH_LOGO placeholder); confirm USDT0 stablecoin address.

## Deploy strategy (2026-07-03, LOCKED — FULLY INDEPENDENT)
Reggie is deploying **HookSwap's OWN complete stack on ALL 7 chains** — full independence, NOT reusing Uniswap's canonical deployments anywhere (even where they exist, e.g. HyperEVM v3+UR, Ink/MegaETH v3). Own everything = fee capture + full control + no dependency on Uniswap governance.
- **Own on every chain:** v2 factory + v2 router + v3 factory (+ v3 periphery: NFT position manager, quoter, tick lens, migrator, multicall) + SwapRouter02 + Universal Router.
- **Bytecode:** standard/canonical Uniswap bytecode → canonical init-code hashes → SDK/SOR forks only need factory ADDRESSES swapped (hashes untouched).
- **WETH:** reuse each chain's canonical wrapped-native where it exists (HyperEVM WHYPE, Ink/MegaETH WETH 0x42..06, XLayer WOKB, Sepolia WETH, **Robinhood WETH `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`** — official Robinhood Chain token, already wired in robinhood.ts). Deploy own WETH9 ONLY on **Tempo** (the only chain with no canonical wrapped-native). Rationale: WETH is a shared wrapper, not "the stack" — deploying your own would create an incompatible token nobody holds.
- **Permit2:** reuse canonical (already live on all 7, deployed by canonical CREATE2 — same address everywhere; not worth redeploying).

### Per-chain deploy list — OWN FULL v2+v3+UR STACK on all 7
| Chain (id) | Deploy (own) | WETH |
|---|---|---|
| Sepolia (11155111) | v2 + v3 + UR (own) | reuse 0xfFf9..6B14 |
| HyperEVM (999) | v2 + v3 + UR (own) | reuse WHYPE 0x5555..5555 |
| Ink (57073) | v2 + v3 + UR (own) | reuse WETH 0x42..06 |
| MegaETH (4326) | v2 + v3 + UR (own) | reuse WETH 0x42..06 |
| XLayer (196) | v2 + v3 + UR (own) | reuse WOKB 0xe538..9b2b |
| Robinhood (4663) | v2 + v3 + UR (own) | reuse WETH 0x0Bd7D308..EAcAD73 |
| Tempo (4217) | v2 + v3 + UR (own) | reuse WETH9 0xBbBcC62853a5fA27b93d6Bab3E6F7ce841E25Df2 as router constructor arg (20 gwei) |

**NO WETH deploys needed on ANY chain** — every chain has a canonical wrapped-native to pass as the router/periphery WETH9 constructor arg.
Tempo note: gas is paid in pathUSD (ERC-20), so interface `tempo.ts wrappedNativeCurrency = null` (correct — leave it); `0xBbBcC62…` is only the WETH9 param for the SwapRouter02/UR/periphery deploy.
Tempo's Uniswap v3 (reference, deploying own): factory 0x24a3d4757e330890a8b8978028c9e58e04611fd6, NPM 0xb71c33f096ceabdc0229110e0d76a6382d01c633, QuoterV2 0x53ab5d7a69db158f621b43ee70423da1e1403c2a, SwapRouter02 0x7e9d53081e961201837336bcd81f52ae92691a8f, UniversalRouter 0xa2dc7d0266f0cc50b3eeaf36c9bfcecff1beea91.

### Deploy pipeline
- v3 via `@uniswap/deploy-v3` CLI (canonical bytecode). v2 via forge-create canonical UniswapV2Factory/Router02. UR via universal-router fork + RouterParameters (v4 fields = address(0)). WETH via contracts/WETH9.sol.
- After deploy: write `contracts/deployments/<chain>.json` → swap factory addresses into HooksOS/sdks (sdk-core CHAIN_TO_ADDRESSES_MAP + V2_FACTORY/ROUTER) and smart-order-router addresses.ts. Init-code hashes stay canonical.
- THEN: bootstrap liquidity (own seed + LP incentives) — the real launch blocker; empty pools quote nothing.

## Deploy pipeline (RESOLVED 2026-07-03 — all forks compile, keyless prep DONE)
Forks at `C:/Users/avone/OneDrive/Desktop/HokkOS/forks/`. Foundry installed.
**Per-chain deploy order:**
1. Permit2 — already on-chain (canonical `0x0000..78BA3`), skip.
2. WETH9 — reuse each chain's existing (see table above), skip deploy.
3. **v2**: `cd forks/v2-core && forge build` → deploy `UniswapV2Factory(feeToSetter=deployer)`; `cd forks/v2-periphery && forge build` → deploy `UniswapV2Router02(factory, weth9)`. (foundry.toml committed to both forks.)
4. **v3**: build the CLI from GitHub (npx is 404 — restricted pkg):
   `git clone https://github.com/Uniswap/deploy-v3 && cd deploy-v3 && npm install && NODE_OPTIONS=--openssl-legacy-provider npm run build`
   then `node dist/index.js --private-key <k> --json-rpc <rpc> --weth9-address <weth> --native-currency-label <SYM> --owner-address <deployer> --v2-core-factory-address <v2Factory from step 3> --state deployments/<chain>-v3.json`
   (deploys v3-core + v3-periphery + SwapRouter02).
5. **UniversalRouter**: `cd forks/universal-router && forge build --skip 'script/**' --skip 'test/**'` (stale DeployTempo script has wrong arg count). Deploy with the **11-field RouterParameters** (this fork = newer v4+Across UR; v4 fields zeroed):
   permit2=`0x0000..78BA3`, weth9=<per-chain>, v2Factory=<step3>, v3Factory=<step4>, pairInitCodeHash=`0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f`, poolInitCodeHash=`0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54`, v4PoolManager=0, permissionsAdapterFactory=0, v3NFTPositionManager=0, v4PositionManager=0, spokePool=0.
- v2 pair init hash CONFIRMED == canonical → SDK/SOR forks need only factory ADDRESSES (hashes untouched).
- Verify the deployed UR version matches the interface's `supportedURVersions` (`_2_0`) at deploy time.

## ~~BLOCKER: deployer key malformed~~ RESOLVED (2026-07-03; confirmed 2026-07-07)
`contracts/.env` DEPLOYER_PRIVATE_KEY was 71 non-hex chars after `0x`. **Fixed** — the audit (2026-07-07) measured the key shape as exactly 64 hex (shape only; key never printed), consistent with all deploys having completed. No longer a blocker.

## Design handoff — HookSwap Terminal (for later; deploy is current priority)
`C:/Users/avone/OneDrive/Desktop/design_handoff_hookswap_terminal/` — pixel-perfect "Terminal" redesign: 13 screens (B01 landing … B13 notifications) with screenshots, `design/HookSwap Redesign.dc.html` (build the "Option B / Terminal" column, id "1b"), `README.md` (exact color/type/spacing spec), `CLAUDE_PROMPT.md` (build prompt). Key: 226px left rail, IBM Plex Mono for all numerics/addresses/tickers, NO mock data (bind every value to live source). Supersedes the earlier Atlas plan for the redesign. Do after deploys.

## Live deploy progress (2026-07-03) — deployer 0xc14C897c6bff88a5Eeac31F795693b9230205125
- **Ink (57073): v2 DEPLOYED** — factory 0xD1Cf664944173140AFc302c169eFD55c24966B45, router02 0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA (see contracts/deployments/ink.json). v3+UR pending.
- **Key format gotcha:** .env key is bare 64-hex (no 0x). forge accepts it; the deploy-v3 CLI needs `0x`-prefixed (regex `^0x[a-zA-Z0-9]{64}$`) → pass `0x$(echo $KEY | tr -d '\r\n ' | sed 's/^0x//')`.
- **Gas gotcha:** deploy-v3 CLI `--gas-price` is `parseInt` GWEI (integer only) — can't express Ink/MegaETH 0.001 gwei or Robinhood 0.02 gwei. At 1 gwei the ~20M-gas v3 deploy costs ~0.02 ETH > the ~0.002 ETH L2 balances → "gas required exceeds allowance". Fix: patch CLI to fractional gwei, OR fund each L2 deployer with ~0.03 ETH. HyperEVM (0.187 HYPE) + Tempo (large) have enough as-is.

## Deploy agent findings (2026-07-03, agents died on session limit — resets 12:40am PT)
Four per-chain deploy agents ran but hit the account session limit mid-diagnosis. Key findings to resume from:
- **deploy-v3 fractional-gwei fix (EXACT):** `gasPrice` is passed as a BigNumber **wei** override straight to ethers. Patch = in `index.ts` parse `parseFloat(program.gasPrice)` (fractional gwei), and in the deploy lib (`deploy.ts` / node_modules/@uniswap/deploy-v3) convert with `Math.round(gwei * 1e9)` to wei. Rebuild `NODE_OPTIONS=--openssl-legacy-provider npm run build`. Copy CLI per-chain to avoid clobber.
- **HyperEVM BIG BLOCKS (RESOLVED):** small blocks = 3M gas, big blocks = 30M gas. Factory/v3 deploys exceed 3M → need big blocks. Enable BEFORE deploying: (1) deployer must be a HyperCore user (holds HYPE, so likely yes); (2) submit signed HyperCore action `{"type":"evmUserModify","usingBigBlocks":true}` to POST https://api.hyperliquid.xyz/exchange (use hyperliquid-python-sdk `exchange.use_big_blocks(True)` or equivalent signer). Persists until unset. Use RPC method `bigBlockGasPrice` to estimate big-block base fee. THEN forge/deploy-v3 deploys land in big blocks.
- **MegaETH (4326):** key OK, 0.002083 ETH, gas 0.001 gwei — all deploys cheap once fractional-gwei patch applied. Ready.
- **Robinhood (4663):** key OK, WETH9 valid, nonce 0, 0.0044 ETH covers 200M+ gas at 0.05 gwei. Ready.
- **Ink (57073):** v2 already live; needs v3 (patched CLI) + UR.
- **RESUME after 12:40am PT** (session limit). Real-money deploys should NOT be run when a rate-limit could interrupt mid-sequence (v3 = ~10 sequential txs → partial deploy risk).

## 🎉 CONTRACT DEPLOYMENT COMPLETE (2026-07-04) — deployer 0xc14C897c6bff88a5Eeac31F795693b9230205125
Own v2 + v3 + Universal Router stack LIVE on ALL target chains:
- **MegaETH (4326), Robinhood (4663), Ink (57073)** — identical deterministic addresses (nonce 0): v2Factory 0xD1Cf66..6B45, v2Router 0xBe3729..EEFA, v3Factory 0xAa1f5B..D7f3, NPM 0xbd8170..577d, QuoterV2 0x15cD41..c78E, SwapRouter02 0xE8526A..7EE4, UR 0x3D3013..93b3.
- **XLayer (196)** — v2Factory matches (0xD1Cf66..); v3/UR nonce-shifted (dup factory at nonce 1). See xlayer.json.
- **HyperEVM (999)** — big-blocks enabled via Hyperliquid evmUserModify; addresses non-deterministic. UR 0xD9d479..43AB.
- **Tempo (4217)** — pathUSD gas (~5-6x schedule, 20 gwei floor); addresses non-deterministic. UR 0x62aE01..661E.
- **Sepolia** — uses canonical Uniswap stack (already live, already in sdk-core).
Every chain's addresses in contracts/deployments/<chain>.json. Permit2 + WETH reused everywhere (no deploys). Init hashes canonical.

## PRODUCTION PLAN (2026-07-04, from Reggie): UI-FIRST
- **Priority: finish the Terminal UI redesign** (all core screens, pixel-perfect, data-bound to what's available, NO mock data → polished loading/empty states). Backend/live-swaps AFTER.
- **Hooks: REMOVED entirely** from the UI (v2/v3 only — no Hooks nav, no hook selector, no hook config bar, no Hooks-live widget). Not "coming soon" — gone.
- **Liquidity: not yet / small** — build launch-ready, demo on testnet/small pools, seed real liquidity later.
- Terminal is the CORE app now (/ and /swap render it). Screens: B2 Swap ✅ live, B3 Markets (in progress), then Pools/Portfolio/Activity. Analytics/Settings/Notifications/Search later.
- **Remaining to LIVE SWAPS (deferred, post-UI):** (1) dependency override interface+routing → HooksOS/sdks+SOR forks; (2) deploy routing-api + a Trading API adapter; (3) hosted RPC/indexer; (4) on-chain liquidity (the real launch blocker). Confirm deployed UR version == interface supportedURVersions `_2_0`.

## Infra decisions (2026-07-04, from Reggie)
- **Deploy target: VPS, not AWS.** Trading API adapter + routing = long-running Node/Express server(s) on a VPS (Docker/pm2 + nginx + certbot TLS), NOT AWS Lambda/CDK. Adapter recommended to embed the HooksOS smart-order-router in-process (option b) rather than proxy an AWS routing-api. See trading-api-adapter/DEPLOY.md.
- **Hosted RPC: Infura key** (in apps/web/.env.local, gitignored; rotate after launch — was shared in chat). Infura serves Ethereum mainnet + **Sepolia** + major L2s — use it for Sepolia/mainnet. It does NOT serve the 6 HookSwap custom chains (MegaETH/Robinhood/Ink/XLayer/HyperEVM/Tempo) → those keep their public RPCs until dedicated nodes are provisioned.
- **UI progress:** Terminal is core app. B2 Swap ✅ (hooks removed, pixel-tightened, MEV toggle live), B3 Markets ✅ (real pools/TVL/volume/APR/sparklines/heatmap). Next: Pools, Portfolio, Activity.

## SDK fork address status (2026-07-04; re-audited 2026-07-07)
- sdks (sdk-core @ 79285a0f) + SOR (@ efd0ba1): MegaETH/Robinhood/Ink/XLayer/HyperEVM = COMPLETE real addresses.
- ~~FOLLOW-UP: Tempo only v2-factory in the forks~~ **RESOLVED** — the 2026-07-07 contracts audit verified `vendor/sdk-core` `CHAIN_TO_ADDRESSES_MAP` has Tempo (4217) FULLY wired (v3Factory/QuoterV2/NPM/tickLens/multicall/swapRouter02/v2Factory/v2Router), matching tempo.json. SOR fork has all 7 chains too.
- **Only `@uniswap/sdk-core` is workspace-overridden** (`resolutions` → `vendor/sdk-core`). SOR fork is consumed by the adapter, NOT the web app. `@uniswap/universal-router-sdk` is NOT overridden → see the UR resolver note in the 2026-07-07 session log.

## Session 2026-07-07 — stack sweep + fixes (5-agent audit UI+contracts)
Read-only audits (chains / rebrand / terminal UI / contracts / routing) + fixes applied:
- **Terminal UI redesign — verified DONE.** SwapScreen refactored into `screens/swap/` panels (TerminalChartPanel/TerminalMarketsPanel/TerminalSwapReviewFlow). All 15 screens audited: NO mock data, no v4/hook leakage, honest empty/"—" states. Pools/Portfolio/Activity got minor pixel/token fixes (all real-data-bound). Screens B2–B13 demo-ready.
- **Connect button** added top-right of the Terminal `TopBar` (was only in the left rail; users expected top-right). Reuses the already-mounted `AccountDrawer` (disconnected→open, connected→toggle). The collapsed left-rail wallet chip's green square = `terminalTokenGradients.walletAvatar`.
- **Rebrand:** browser `<title>` `title.uniswapTradeCrypto` → "HookSwap | Trade crypto onchain" across all 15 locale files; meta-injector tests updated to HookSwap title/description.
- **Rebrand asset audit — DONE (relaunched 2026-07-07).** Result: rebrand is substantially complete. Two prior TODOs were STALE/already-fixed: (1) nav logo is NOT the unicorn — both `apps/web/src/terminal/components/HookLogo.tsx` (Terminal, used in TopNav.tsx:299) and `apps/web/src/components/Logo/NavIcon.tsx`→`HookMark` (legacy) render the HookSwap hex+hook glyph; (2) Inter font IS wired + bundled (`index.html:63–79`, `public/fonts/Inter-normal.var.ttf` + Latin woff2), Basel gone, no 404. IBM Plex Mono/Sans + Space Grotesk woff2 present for Terminal. Favicon (`public/favicon.svg` HookSwap hex), full PNG icon set + `site.webmanifest` all HookSwap-confirmed. **3 REMAINING GAPS — all social-share IMAGE assets (need real branded PNGs, Reggie/design):**
  - **A1** `apps/web/public/images/1200x630_Rich_Link_Preview_Image.png` = still Uniswap unicorn; it's the DEFAULT og:image/twitter:image for all crawler pages. Referenced by `functions/components/metaTagInjector.ts:222` (hardcodes 1200×630 dims, lines 81–82) + `src/pages/metatags.ts:9`. Fix = repoint both refs to a HookSwap 1200×630 (note `og-hookswap-1500x500.png` is wrong aspect for this slot).
  - **A2** `apps/web/public/images/324x74_App_Watermark.png` = Uniswap white wordmark stamped on every generated token/pool/auction card (with misleading `alt="HookSwap"`). Defined `functions/constants.ts:1` `WATERMARK_URL`; used in `functions/api/image/{tokens,pools,auctions}.tsx`. Fix = swap for HookSwap white wordmark (source from `public/brand/logo-reversed.png` or `powered-by/*`).
  - **A3** `apps/web/public/brand/og-hookswap-1500x500.png` (wired into `index.html:28,32`) = the HookSwap OG image itself reads "The hook-native DEX on **Uniswap v4**", advertises hooks (VIOLATES locked no-hooks decision), wrong domain `app.hookswap.io` (canonical hookswap.org), mock stats. Fix = regenerate without v4/hooks + correct domain.
  - Low-risk leftovers (NOT user-visible): dead-code "UniswapX" i18n strings only consumed by the unrouted legacy `UniswapXCard.tsx`; `settings.footer` "Uniswap Team 🦄" is mobile-only; orphaned unreferenced `images/{192x192,512x512}_App_Icon.png` + legacy-Landing `UniswapX*.svg`/`Unichain*.svg`.
- **Rebrand REPOINT applied (2026-07-07) — Uniswap imagery no longer served.** Per Reggie ("repoint to existing brand assets now"), pointed all OG/watermark refs at existing clean `apps/web/public/brand/` assets (the Uniswap unicorn/wordmark PNGs are no longer referenced by any code path):
  - **A1** default og/twitter image → `/brand/logo-horizontal.png` in `functions/components/metaTagInjector.ts:222` + `src/pages/metatags.ts:9`. Updated the two test assertions (`functions/components/metaTagInjector.test.ts`, `functions/default.test.ts`) to match — `metaTagInjector.test.ts` passes 8/8; `default.test.ts` is a live-server integration test (ECONNREFUSED :3000 offline, pre-existing, not validatable without `bun web dev`).
  - **A2** watermark `WATERMARK_URL` (`functions/constants.ts:1`) → `/brand/logo-reversed.png` (white logo; cards are dark bg). Fixed the stamped `<img>` width 324px→**219px** in tokens/pools/auctions `.tsx` to preserve the 1280×420 logo's 3.05:1 aspect (was squished to 4.5:1).
  - **A3** `index.html:28,32` og/twitter image → `/brand/logo-horizontal.png` (removes the live "Uniswap v4" + hooks + wrong-domain `og-hookswap-1500x500.png` from the static OG).
  - **INTERIM CAVEAT (still ideal to fix with design):** `logo-horizontal.png` is 1280×420 transparent — not a purpose-built opaque 1200×630 social card. The injector still declares `og:image:width/height` 1200×630 (correct for the genuinely-1200×630 generated token/pool cards — do NOT change those). A proper opaque 1200×630 HookSwap OG card + a dedicated white watermark are still the real fix; these repoints just remove all Uniswap-branded imagery in the meantime.
- **Prod `tsc` build-breaks fixed** (invisible to esbuild/dev; caught only by `apps/web/tsconfig.terminal-check.json`):
  - `packages/chains/src/rpc/types.ts` — the "canonical" `UniverseChainId` enum was **missing `Ink` + `HyperEvm`**, diverged from the app enum → ~26 cascade errors across web/wallet/provider plumbing. Added both. (tsc 28→8→clean.)
  - `packages/ui/.../color/colors.ts` — added `chain_999`/`chain_57073` tokens + `hyperevm`/`ink` `networkColors` (brand-accent hexes are tunable).
  - `LockerScreen` chainId narrowed to EVM (excl. Solana) for wagmi reads; + 6 residual non-chain errors (TerminalCommandPalette nav-icon `Partial`, TerminalShell onNavigate id-forward, SwapWidgetPage `TransactionState` annotation, AcrossRoutingInfo color prop, 2× unused `@ts-expect-error` in planSaga).
- **Adapter:** filled real `v3QuoterV2` for HyperEVM (`0x3b5a01Ef…`) + Tempo (`0x15cD41…`) in `trading-api-adapter/src/chains.ts` (HyperEVM `ready:true`; Tempo `ready:false` pending pathUSD-gas validation). `.env.example` default `ROUTING_MODE=embed` (was blank → 404).
- **Universal Router P0 (client-side execution):** `@uniswap/universal-router-sdk` is NOT overridden → `UNIVERSAL_ROUTER_ADDRESS()` throws/returns wrong addr for the 7 chains. Fixed via a local resolver `apps/web/src/constants/hookswapUniversalRouter.ts` (real deployed UR per custom chain from deployments JSON; delegates others to the SDK), wired into `useUniversalRouter.ts`. **STILL TO VALIDATE:** deployed UR `_2_0` vs this SDK's swap calldata command set — test a testnet swap before enabling custom-chain execution.
- **Still needs Reggie (can't do from repo):** (1) deploy the adapter to the VPS (`trading.hookswap.org` DNS/TLS) with `ROUTING_MODE=embed`; (2) broadcast liquidity — `contracts/seed/SeedLiquidity.s.sol` + `SeedPools.s.sol` are ready, need funded key per chain; (3) confirm UR version compat on-chain.

## Routing / UR wiring verification (2026-07-07 — read-through, no on-chain)
Verified the go-live routing chain end to end by reading the actual files (facts, not doc-trust). Result: wiring is CORRECT and the docs UNDERSTATED readiness.
- **UR version (#4) — CONSISTENT on paper; on-chain testnet swap = the only remaining gate.**
  - UR addresses IDENTICAL across all 3 sources for all 6 custom chains + Sepolia: `contracts/deployments/<chain>.json` == `trading-api-adapter/src/chains.ts` == `apps/web/src/constants/hookswapUniversalRouter.ts` (MegaETH/Robinhood/Ink `0x3D3013..93b3`, XLayer `0x6d8a07..1005`, HyperEVM `0xD9d479..43AB`, Tempo `0x62aE01..661E`).
  - Interface emits UR **2.0** calldata: `useUniversalRouter.ts` calls `SwapRouter.swapCallParameters` (universal-router-sdk **4.33.0**, the v4+Across generation) with NO `urVersion` → v4-sdk `v4Planner.addTrade` defaults `URVersion` to **V2_0**. Deployed URs are the `_2_0` fork (tempo.json `universalRouterNote`). MATCH.
  - HookSwap is v2/v3-only (`supportsV4:false`) → only the stable core UR command set is exercised (WRAP/UNWRAP/V2_SWAP/V3_SWAP/PERMIT2/SWEEP), identical across UR 1.2/2.0/2.1; the version-divergent v4 action encoding is never hit → low risk.
  - Adapter's `embedRouter.ts` also hardcodes UR version `'2.0'` for calldata assembly — consistent with interface + deployed.
  - ONE cosmetic mismatch (not a bug for custom chains): `useUniversalRouter.ts:120` passes `UniversalRouterVersion.V1_2` to the ADDRESS resolver. Ignored for the 6 custom chains (address from the map). For Sepolia it delegates to the SDK's V1_2 slot while calldata is V2_0 — fine for core v2/v3 commands but that's the exact spot to sanity-check on the Sepolia testnet swap.
  - FINAL GATE unchanged: one real testnet swap proves the deployed fork accepts the calldata byte-for-byte; cannot be proven by static reading.
- **Dependency override (#3) — ACTIVE (docs understated).** INSTALLED `node_modules/@uniswap/sdk-core` (7.18.0) DOES carry the custom chains (MEGAETH/ROBINHOOD/HYPEREVM + 14 custom-address markers) — `resolutions: @uniswap/sdk-core → file:./vendor/sdk-core` is live for the web app. vendor/sdk-core (src 7.17.0) also has all 7 chains, so a fresh `bun install` stays correct. `@uniswap/universal-router-sdk` NOT overridden → handled by the local resolver (verified above). Adapter deps wired: sdk-core `file:../vendor/sdk-core` + SOR `file:../../smart-order-router` (fork EXISTS at `HokkOS/smart-order-router` with custom-chain static v2/v3 subgraph providers), NOT `npm install`ed here (disk-constrained; Reggie installs on VPS).
- **Adapter embed routing (#1) — CODE FULLY IMPLEMENTED (docs were STALE, now fixed).** `trading-api-adapter/src/embedRouter.ts` is a complete 118-line `EmbedRoutingProvider.quoteExactRoute` (AlphaRouter + `StaticV2/V3SubgraphProvider` on-chain pool discovery + UR-2.0 calldata + honest `undefined`→404), wired in `routingClient.ts:145` (`ROUTING_MODE=embed`). DEPLOY.md §0/§7 + routingClient.ts header still said "[TODO]/NOT active" — **corrected 2026-07-07** to "IMPLEMENTED, just `npm install`." Deploy itself = Reggie's VPS/DNS/TLS/install (runbook complete).
- **RPC (#2) — CONFIG READY, keys-gated.** `resolveRpcUrl` + `config/rpc.env` wiring done (env-override→public-fallback); Infura for Sepolia/mainnet, public RPCs for the 6 custom chains until dedicated nodes. Needs Reggie's real keys only.

## VPS deploy — adapter promoted to EMBED / production (2026-07-07)
Deployed on the VPS `15.204.8.186` (ssh `ubuntu@`, systemd; NOT Vercel/AWS). State verified live, not assumed.
- **Frontend `hookswap.org`** — already live before this session (static SPA behind nginx, `/var/www/hookswap.org`, HookSwap-branded, `<title>HookSwap Interface`). Deploy pattern = backup (`.bak.*`) + replace web root. NOTE: this live build predates today's rebrand-repoint commit (e037a835) — a rebuild+redeploy is needed to push the OG/watermark image changes (low urgency, crawler-facing only).
- **Trading adapter `trading.hookswap.org`** — was running but in `routingMode:none` (empty `ROUTING_MODE` → NullRoutingProvider → every quote 404 "no backend"). nginx proxies the domain → `127.0.0.1:4090`. systemd unit `hookswap-trading-api.service`. (`:4000` is a DIFFERENT HookOS platform app — not the adapter.)
- **Root-caused the embed failure:** a test embed instance (`hookswap-embed-test.service`, :4091, dir `~/hookswap-adapter-embed`, deps+build present) was in embed mode but quotes died with `could not detect network (NETWORK_ERROR)`. TWO causes: (1) `config/rpc.env` had an **inline `# comment`** on the Sepolia line — systemd `EnvironmentFile` does NOT strip inline comments → the RPC URL was `https://…/v3/<key>   # Sepolia` (malformed); (2) even cleaned, the **Infura project lacks Sepolia network access** (`"project ID does not have access to this network"`). Fix applied: stripped inline comments from all `WEB3_RPC_` lines; pointed `WEB3_RPC_11155111` → public `https://ethereum-sepolia-rpc.publicnode.com` (sidesteps the Infura-Sepolia gap). Backups made (`*.bak.<ts>`).
- **Validated embed end-to-end:** after the fix, `:4091` quote returned honest `NO_ROUTE_FOUND` ("expected until on-chain liquidity exists") — routing runs, RPC reachable, SOR loaded, no fabricated price. **Liquidity is the sole remaining gate.**
- **Promoted PUBLIC `:4090` to the validated embed build:** the old `~/hookswap-trading/trading-api-adapter` is a STALE checkout (no `embedRouter.ts`, no SOR, `npm install`=up-to-date). So instead of upgrading it, repointed `hookswap-trading-api.service` at the working `~/hookswap-adapter-embed` via a systemd drop-in (`/etc/systemd/system/hookswap-trading-api.service.d/embed.conf`: `WorkingDirectory`=embed dir, `EnvironmentFile=` reset+embed dir's .env+rpc.env). GOTCHA: `Environment=PORT=4090` did NOT override the embed `.env`'s `PORT=4091` → bound :4091 → `:4090` empty → **public 502 for ~2 min**. Fixed by setting the embed `.env` `PORT=4090` directly (test svc stopped+disabled, so 4091 is free). Now `:4090` = `routingMode:embed`, `https://trading.hookswap.org/health` 200, public `/v1/quote` returns honest liquidity-gated 404, service `enabled` (survives reboot).
- **Frontend SPA rebuilt + redeployed (2026-07-07)** to ship the rebrand-image repoints (commit 9158b89, pushed to origin/hookswap-rebrand). Built ON the VPS from `~/HookSwap-build` with the PINNED toolchain (isolated bun 1.3.11 at `~/.bun1311/bin` + `nvm use 22.22.2`) — **NO `VERCEL=1`** (Reggie rejected that; it disables vite minify + there is no Vercel here). Recipe: `bun install` → `SKIP_CONFIG_PULL=true USE_NEW_CONFIGS=false bun x nx build web -c production` (nx auto-runs codegen: graphql/tradingapi/abi/v3) → overlay `rsync -a apps/web/build/client/ /var/www/hookswap.org/` (NO --delete, + full dir backup `/var/www/hookswap.org.bak.<ts>` to preserve PDFs/.well-known). VERIFIED LIVE: `hookswap.org` og:image + twitter:image = `/brand/logo-horizontal.png`; the old `og-hookswap-1500x500`/`1200x630_Rich` unicorn images are gone; HTTP 200. NOTE: the `functions/` OG changes (metaTagInjector/image handlers) are Cloudflare Pages Functions — inert on the VPS static nginx serve, so the static `index.html` og tags are authoritative (and now correct). `vps-deploy.sh` is STALE (plain `bun install` → fails the strict `check-runtime-versions.sh`); use the pinned-toolchain recipe in the [[deploy-on-vps]] memory.
- **Still needs Reggie (sole swap blocker + 1 creds item):** (1) **seed on-chain liquidity** (`contracts/seed/*.s.sol`, funded key) — until then every quote 404s; (2) enable **Sepolia on the Infura project** (or keep publicnode) if Infura-served Sepolia is wanted.

## XLayer routing deep-dive (2026-07-08) — 2 fixes shipped, 1 systemic blocker
Traced why XLayer quotes returned NO_ROUTE despite a seeded pool. Chain of 3 gaps; each fix revealed the next:
- **Seed status:** a `SeedLiquidity.s.sol` run DID execute on XLayer (196) and SUCCEEDED (4/4 receipts, commit 620c80184c, deployer 0xc14C897c) — created `SeedTestToken 0x144331bb…` + `addLiquidity(1000 STT + 0.05 WOKB)`. On-chain pair `0x1a95898916c7872f4712c92a1b665e54414728bd` HAS reserves. So liquidity exists; the problem was the router couldn't see/use it. (I did NOT seed anything — no funded key.)
- **Gap 1 — v2 pair factory (FIXED, shipped).** `@uniswap/v2-sdk` `FACTORY_ADDRESS_MAP` has no entry for the 6 custom chains, so `Pair.getAddress()` used the MAINNET factory → wrong pair address → pool never found. Fix: `HOOKSWAP_V2_FACTORY_ADDRESSES` map + `computePairAddress(factory,…)` in the SOR's v2 static-subgraph + pool providers. PROVEN: computed addr == on-chain `0x1a95…28bd`. SOR fork commit **5b28db5** (HooksOS/smart-order-router main), built + deployed to VPS `/home/ubuntu/smart-order-router` (checkout origin/main -- <files> to preserve VPS package.json path, `npm run build:main`, restart `hookswap-trading-api.service`). Broke v2 routing on ALL 6 custom chains, not just XLayer.
- **Gap 2 — gas-USD pool requirement (FIXED, shipped).** SOR threw "Could not find a USD/<sym> pool for computing gas costs" (no USD/native pool on XLayer) → killed the route. Fix (subagent): made USD-pool lookups return null + zero-fill gasUseEstimateUSD across gas-factory-helpers + v2/tick-based/mixed gas models + getGasModels. SOR fork commit **3acce5b**, built (clean tsc) + deployed. After this, the route is FOUND.
- **Gap 3 — DUPLICATE jsbi copies (FIXED, live). NOT a native-bigint issue** (earlier hypothesis was WRONG). Route assembled a v2 Trade → `Trade.maximumAmountIn` → `Percent.lessThan(ZERO)` → vendored sdk-core `tryParseFraction` threw "Could not parse fraction". BOTH the vendored sdk-core AND v2-sdk (SOR's is 4.17.0) are JSBI. Real cause: the vendored sdk-core is **symlinked** into the SOR (`node_modules/@uniswap/sdk-core` → `../../../HookSwap-build/vendor/sdk-core`), so at runtime it resolves `jsbi` from its PHYSICAL location `HookSwap-build/node_modules/jsbi`, while v2-sdk resolves `smart-order-router/node_modules/jsbi` — **two different physical jsbi copies (both 3.2.5)** → a JSBI from one is not `instanceof` the other's class → tryParseFraction rejects it. Fix: symlink `HookSwap-build/vendor/sdk-core/node_modules/jsbi` → the SOR's jsbi so all @uniswap SDKs share ONE JSBI class. Made persistent via a systemd drop-in `ExecStartPre` on `hookswap-trading-api.service` (`.../jsbi-dedup.conf`) that recreates the symlink on every start (survives web rebuilds that recreate HookSwap-build).
- **✅ XLayer QUOTES END-TO-END (2026-07-08):** `POST /v1/quote` WOKB→SeedTestToken returns a real classic quote (0.001 WOKB → **19.55 STT** via the seeded v2 pool). All three fixes required together. Adapter healthy, embed mode, persistent. The `~/smart-order-router` symlink→jsbi dependency is fragile (web rebuild recreates HookSwap-build/vendor/sdk-core, losing the nested jsbi symlink until adapter restart re-runs ExecStartPre) — acceptable, but a proper fix is deduping jsbi in the install or copying the vendored sdk-core into the SOR tree.
- **Net:** XLayer routing fully works (discovery + gas + jsbi). Same fixes apply to the other 5 custom chains once each has a seeded pool. Both SOR code fixes committed/pushed/deployed (5b28db5, 3acce5b); jsbi dedup is a VPS systemd drop-in (not code). Real USD-pool liquidity still improves gas-USD accuracy but is no longer required to quote.

## Gate #2 (Robinhood swap execution) — FOUND + FIXED in adapter (2026-07-12, ON-CHAIN VERIFIED)
The deployed Robinhood Universal Router `0x3D30133F4d4A80684F02d8310faF572E3dc193b3` is a **non-canonical "min-hop-price" fork**: its V2/V3 `SWAP_EXACT_IN/OUT` inputs decode **6 fields** — the canonical 5 plus a trailing `uint256[] minHopPriceX36` (empty = disabled; see `forks/universal-router/contracts/base/Dispatcher.sol:178-211` + `V2SwapRouter.sol:27,76`). The interface + adapter (`@uniswap/universal-router-sdk`) emit the canonical **5-field** layout → the deployed UR reads the path-length word as a bogus array offset → reverts **`0x3b99b53d SliceOutOfBounds()`** at decode, before any token movement. So EVERY RH swap failed at the contract, ahead of liquidity. (This corrects the 2026-07-07 "deployed UR `_2_0` matches interface V2_0 calldata / low risk" note — contradicted on-chain.)
- **Root-caused two ways:** read the deployed fork source, AND on-chain isolation (`eth_call` from a holder: 5-field → `SliceOutOfBounds`; hand-built 6-field w/ empty `minHopPriceX36[]` → `0xd81b2f2e AllowanceExpired`, i.e. decode passed, reached Permit2).
- **FIX (Path B, chosen by Reggie — no redeploy/key):** adapter-side calldata shim `trading-api-adapter/src/urCalldata.ts` (`patchMinHopPriceCalldata`) re-encodes every V2/V3 swap-command input to append an empty `uint256[] minHopPriceX36`, matching the deployed ABI. Wired at the single choke point `embedRouter.ts` `mapSwapRouteToResponse` (methodParameters.calldata) → flows to `/v1/swap` `data`. Idempotent no-op on non-swap commands / already-6-field.
- **VALIDATED on-chain end-to-end (not just typecheck):** fed the LIVE adapter's real `/v1/swap` calldata through the shim → `eth_call` vs the real deployed UR: original 5-field `SliceOutOfBounds`, patched 6-field `AllowanceExpired`. **Decode now passes.** `urCalldata.ts` typechecks clean (`--strict`, isolated).
- **REMAINING to a real RH swap:** (1) **deploy the patched adapter to the VPS** (`hookswap-trading-api.service`, embed `:4090`) — not yet deployed, this is a code-only VPS deploy; (2) then a real signed swap needs WETH→Permit2 approval + non-zero WETH balance (the residual `AllowanceExpired` — handled by the interface's `/v1/check_approval` step + a funded wallet); (3) production liquidity depth (dust seed only: 0.0002 WETH / 0.2 tHOOK). Also committed `DATA_API_BASE_URL_V2_OVERRIDE` to `apps/web/.env` so future web builds can't silently regress Markets/token-lists off `data.hookswap.org`.

## Decision log
- 2026-07-12: RH UR calldata mismatch fixed adapter-side (Path B: append empty minHopPriceX36[]) rather than redeploying a canonical UR — no funded key / no redeploy, ships as a VPS code deploy.
- 2026-07-07: VPS adapter promoted to embed on :4090 by repointing the systemd service at the validated `~/hookswap-adapter-embed` build (stale `~/hookswap-trading` checkout lacked embedRouter/SOR); systemd `Environment=PORT` does NOT override an `EnvironmentFile` PORT — set PORT in the .env directly.
- 2026-07-07: Universal Router resolution patched via a local address resolver (NOT a universal-router-sdk fork) — lower maintenance; addresses from deployments JSON.
- 2026-07-07: Terminal wallet connect exposed in the top bar (not just the left rail) to match user expectation.
- 2026-07-03: Kept `@uniswap/*` package names; rebrand is user-facing only.
- 2026-07-03: Removed `tools/uniswap-nx` workspace entry to unblock install.
- 2026-07-03: v4 excluded; HyperEVM+Robinhood+Sepolia targeted; self-host routing; brand existing swap UI.
- 2026-07-03: Documented Windows/bun localhost bring-up bypass.

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

## BLOCKER: deployer key malformed (2026-07-03)
`contracts/.env` DEPLOYER_PRIVATE_KEY is 71 non-hex chars after `0x` (must be exactly 64 hex). Reggie must fix: line = `DEPLOYER_PRIVATE_KEY=0x<64 hex>` — no quotes/spaces/comment/trailing text. Then fund wallet (HYPE/ETH/etc per chain) and run deploys. Key never printed; only shape measured.

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

## Decision log
- 2026-07-03: Kept `@uniswap/*` package names; rebrand is user-facing only.
- 2026-07-03: Removed `tools/uniswap-nx` workspace entry to unblock install.
- 2026-07-03: v4 excluded; HyperEVM+Robinhood+Sepolia targeted; self-host routing; brand existing swap UI.
- 2026-07-03: Documented Windows/bun localhost bring-up bypass.




















































# HookSwap — Repos to Fork (Uniswap → HookSwap full stack)

Tailored to the locked decisions: **v2 + v3 only (no v4/hooks), self-hosted routing, chains = Sepolia + HyperEVM + Robinhood, brand = HookSwap / hookswap.xyz.**

## ✅ FORKED into HooksOS org (2026-07-03, via gh as OxForged)
All 15 forked: `HooksOS/{v2-core, v2-periphery, v3-core, v3-periphery, swap-router-contracts, universal-router, permit2, sdks, smart-order-router, routing-api, v3-subgraph, v2-subgraph, token-lists, default-token-list, assets}`. Interface already = `HooksOS/HookSwap` (this repo). v4 repos intentionally NOT forked.
Next per repo: contracts → deploy; sdks → add HyperEVM chain-id + deployed addresses; smart-order-router/routing-api → self-host; default-token-list/assets → brand.

Legend: **FORK+BRAND** = fork, modify, publish/host under HookSwap · **DEPLOY** = deploy the contracts as-is (open license) · **SKIP** = not needed for v2/v3 stack.

---

## Tier 1 — Contracts to DEPLOY (per chain: Sepolia, HyperEVM, Robinhood)
Open-licensed; you deploy them with your funded deployer key. No code fork needed unless you want changes.

| # | Repo | What it gives you | Action |
|---|------|-------------------|--------|
| 1 | `Uniswap/v2-core` | `UniswapV2Factory`, pair | DEPLOY |
| 2 | `Uniswap/v2-periphery` | `UniswapV2Router02` | DEPLOY |
| 3 | `Uniswap/v3-core` | `UniswapV3Factory`, pool (BUSL expired → GPL) | DEPLOY |
| 4 | `Uniswap/v3-periphery` | `NonfungiblePositionManager`, `SwapRouter`, `Quoter`, `TickLens`, `Multicall2` | DEPLOY |
| 5 | `Uniswap/swap-router-contracts` | `SwapRouter02` (combined v2+v3), `QuoterV2` | DEPLOY — the interface expects this |
| 6 | `Uniswap/universal-router` | `UniversalRouter` (interface routes swaps through this) | DEPLOY — configure with v4 pool manager = 0 / disabled |
| 7 | `Uniswap/permit2` | `Permit2` (approvals) | DEPLOY — deterministic CREATE2 addr `0x000000000022...3` if you use the canonical deployer |
| 8 | WETH9 / wrapped native | wrapped-gas token per chain | Robinhood: deploy WETH · HyperEVM: WHYPE already exists `0x5555…5555` · Sepolia: canonical WETH exists |

**SKIP:** `Uniswap/v4-core`, `Uniswap/v4-periphery` (BUSL + hooks — excluded).

---

## Tier 2 — SDKs to FORK + BRAND (needed to teach the stack your chains)
The interface + routing import these as `@uniswap/*`. You must fork to add **HyperEVM** (chain id 999/998) and your deployed contract addresses. Publish under `@hookswap/*` **or** keep names and repoint via bun `overrides` / `patchedDependencies`.

| # | Repo | Why fork | Action |
|---|------|----------|--------|
| 9 | `Uniswap/sdks` (monorepo) | Houses all SDKs below | FORK+BRAND |
| 9a | └ `sdk-core` | **ChainId enum + WETH/multicall/router addresses.** Add HyperEVM; add your deployed addresses per chain | FORK+BRAND (critical) |
| 9b | └ `v2-sdk` | pair address computation (factory addr + init code hash) — update for your v2 deploy | FORK+BRAND |
| 9c | └ `v3-sdk` | pool address computation (factory addr + init code hash) — update for your v3 deploy | FORK+BRAND |
| 9d | └ `router-sdk` | multi-protocol trade encoding | FORK+BRAND |
| 9e | └ `universal-router-sdk` | Universal Router calldata encoding | FORK+BRAND |
| 9f | └ `permit2-sdk` | Permit2 addr + signatures | FORK+BRAND |

**SKIP:** `v4-sdk`.

> Note: v2/v3-sdk hardcode the **init code hash** of the pair/pool bytecode. If you deploy the standard bytecode unchanged, the canonical hashes still work; if you recompile with different settings, you must update the hashes in your SDK fork.

---

## Tier 3 — Routing / Indexer to FORK + SELF-HOST (per your routing decision)
This is what replaces `interface.gateway.uniswap.org`. Without it, swaps won't quote on your chains.

| # | Repo | Purpose | Action |
|---|------|---------|--------|
| 10 | `Uniswap/smart-order-router` | pathfinding library (uses your SDK forks) | FORK+BRAND, add chains |
| 11 | `Uniswap/routing-api` | the HTTP quoting API (AWS CDK service) | FORK + SELF-HOST → point interface at your URL |
| 12 | `Uniswap/v3-subgraph` | pool/liquidity indexer feeding the router | FORK + deploy per chain |
| 13 | `Uniswap/v2-subgraph` | v2 pair indexer | FORK + deploy per chain |

**SKIP (unless you want UniswapX intents):** `Uniswap/unified-routing-api`, `Uniswap/uniswapx-sdk`.

---

## Tier 4 — Token Lists & Assets to FORK + BRAND
| # | Repo | Purpose | Action |
|---|------|---------|--------|
| 14 | `Uniswap/token-lists` | the token-list JSON schema + tooling | FORK light / reuse |
| 15 | `Uniswap/default-token-list` | the default token set the UI shows | FORK+BRAND — curate HookSwap list for your 3 chains, host at `tokens.hookswap.xyz` |
| 16 | `Uniswap/assets` (token/chain logos) | logo asset repo (`assetRepoNetworkName` points here) | FORK+BRAND — add HyperEVM/Robinhood + token logos |

---

## Tier 5 — Frontend
| # | Repo | Action |
|---|------|--------|
| 17 | `Uniswap/interface` | **Already forked → this repo (HookSwap).** Rebrand + reskin + wire chains (in progress) |
| — | `Uniswap/widgets`, `Uniswap/web3-react` | SKIP (deprecated / bundled) |

---

## Optional — only if HookSwap wants a token + governance
`Uniswap/governance`, `Uniswap/merkle-distributor`, `Uniswap/v3-staker`. Not needed for a working DEX.

---

## Recommended order of operations
1. **Deploy Tier 1 contracts** on Sepolia first (free testnet) → get all addresses.
2. **Fork `Uniswap/sdks`**, plug your Sepolia addresses + add HyperEVM/Robinhood chain ids → publish `@hookswap/*` (or patch in this repo).
3. **Fork + self-host `smart-order-router` + `routing-api` + subgraphs** → get a quoting URL.
4. **Wire this interface** to the SDK forks + routing URL (chain configs + `supportsV4:false`).
5. Repeat contract deploy on HyperEVM + Robinhood; fill addresses into the SDK fork + chain configs.
6. **Token list + assets** fork for the UI.

## npm scoping note
If you publish forked SDKs under `@hookswap/*`, you repoint imports across the interface + router. **Faster path for now:** keep the `@uniswap/*` names and override them to your forks via bun `overrides` / `patchedDependencies` in `package.json` — no import churn, and you only change the addresses/chain-ids inside.

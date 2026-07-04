# Deploy contracts

The HookSwap on-chain stack (v2 + v3 + Universal Router, **no v4**) is already **deployed** on
all 6 custom chains — see [developers/contract-addresses.md](../developers/contract-addresses.md).
This page documents the deploy kit and the resolved pipeline for reference / re-deploys.

Kit: [`contracts/`](../../contracts/) — see [`contracts/README.md`](../../contracts/README.md).

## Prerequisites

- **Foundry** (`forge` + `cast`), **Node 18+** (for `@uniswap/deploy-v3`), **jq**.
- A **funded deployer private key** (the same account must hold gas on each target chain).
- One RPC URL per chain (public defaults provided, rate-limited).
- The HooksOS contract forks cloned + built (`v2-core`, `v2-periphery`, `v3-core`,
  `v3-periphery`, `swap-router-contracts`, `universal-router`, `permit2`).

```bash
cd contracts
cp .env.example .env      # edit: DEPLOYER_PRIVATE_KEY + RPC URLs
export FORKS_DIR="$HOME/hooksos-forks"
```

## Deploy order (not optional — later contracts take earlier addresses)

`scripts/deploy.sh <chain>` runs these in order:

1. **Permit2** — reuse canonical `0x000000000022D473030F116dDEE9F6B43aC78BA3` (already on every
   chain). Check with `cast code <addr> --rpc-url <rpc>`.
2. **WETH / wrapped native** — reuse each chain's existing wrapper (see the per-chain table
   below). No WETH deploy is needed on any HookSwap chain.
3. **v2** — `UniswapV2Factory(feeToSetter=deployer)` then `UniswapV2Router02(factory, weth)`.
   Record the pair init-code hash (canonical `0x96e8ac42…845f` for unmodified bytecode).
4. **v3** — via the canonical CLI `@uniswap/deploy-v3` (deploys v3 core + periphery: factory,
   multicall2, proxyAdmin, tickLens, NFT descriptor, NPM, v3Migrator, quoterV2, v3Staker).
   v3 pool init-code hash is the fixed canonical
   `0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54` (unless you recompiled).
5. **SwapRouter02** — from `swap-router-contracts`, constructor
   `(v2Factory, v3Factory, v3PositionManager, weth9)`.
6. **UniversalRouter** — from `universal-router`, one `RouterParameters` struct with the v2/v3
   values filled and **all v4 fields = `address(0)`**. This fork is the newer v4+Across UR
   (11-field params); confirm the struct against your fork commit and deploy via a small
   `forge script`.

Each run verifies `forge`/`cast`/`jq`/`npx`, that `.env` + `FORKS_DIR` are set, that the live
chainId matches config, and that every reused address has code, then writes
`deployments/<chain>.json`.

## WETH per chain (all reused — no WETH deploy)

| Chain (id) | WETH / wrapped-native |
|---|---|
| HyperEVM (999) | WHYPE `0x5555555555555555555555555555555555555555` |
| MegaETH (4326) | WETH `0x4200000000000000000000000000000000000006` |
| Robinhood (4663) | WETH `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` |
| Ink (57073) | WETH `0x4200000000000000000000000000000000000006` |
| X Layer (196) | WOKB `0xe538905cf8410324e03A5A23C1c177a474D59b2b` |
| Tempo (4217) | WETH9 `0xBbBcC62853a5fA27b93d6Bab3E6F7ce841E25Df2` (constructor arg only¹) |
| Sepolia (11155111) | WETH `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14` |

¹ Tempo pays gas in `pathUSD` (ERC-20) and has no native-gas wrapper; the WETH9 above is only the
router/periphery constructor argument. Do not use native-gas flows on Tempo.

> Note: the kit's original README targeted 3 chains (Sepolia/HyperEVM/Robinhood) and mentioned
> deploying a fresh WETH9 on Robinhood. The **actual** deployment reused Robinhood's official
> WETH `0x0Bd7D308…` — the table above and `contracts/deployments/*.json` are authoritative.

## Per-chain gotchas (resolved during deploys)

- **HyperEVM (999) — big blocks.** Small blocks cap at 3M gas; factory/v3 deploys exceed that.
  Enable big-blocks on the deployer first (Hyperliquid `evmUserModify` `usingBigBlocks:true` via
  the HyperCore exchange API), then deploy. Addresses are non-deterministic (nonce ≠ 0).
- **Tempo (4217) — pathUSD gas / 20 gwei floor.** All txs must be sent at the 20 gwei network
  floor (lower is rejected). Gas is paid in a pathUSD-style unit. Addresses are non-deterministic.
- **`deploy-v3` CLI gotchas:** it needs a `0x`-prefixed key (regex `^0x[0-9a-zA-Z]{64}$`), and its
  `--gas-price` was integer-gwei only — a fractional-gwei patch (`parseFloat` → `Math.round(gwei*1e9)`
  wei) was applied for cheap L2s. The add-1bp-fee-tier step was made idempotent (skip if the
  factory already enabled the 100/1 tier).
- **XLayer (196):** a duplicate v2Factory was accidentally created at nonce 1 and is unused; the
  canonical `0xD1Cf66…` factory is the one wired everywhere. Downstream addresses are shifted by
  one nonce and differ from the deterministic group.

## Feeding addresses back into HookSwap

After deploy, addresses must be wired in **three** places (all required before a swap can quote):

1. **`HooksOS/sdks` fork** — sdk-core address maps + chain IDs; v2-sdk `INIT_CODE_HASH`; v3-sdk
   `POOL_INIT_CODE_HASH`. See [developers/sdk.md](../developers/sdk.md).
2. **This interface's chain config** — `packages/uniswap/src/features/chains/evm/info/*.ts`
   (`wrappedNativeCurrency`, native currency, RPC, explorer).
3. **The routing-api / smart-order-router** — same forked addresses + init hashes, pointed at each
   chain's RPC + subgraph. See [run-routing.md](./run-routing.md).

> With contracts deployed but **no** address wiring and **no** routing backend, the app loads but
> swaps do not quote — there is nothing to price against. All three are required.

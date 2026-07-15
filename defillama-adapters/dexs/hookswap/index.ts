/*
 * HookSwap — Volume + Fees adapter (DefiLlama dimension-adapters convention)
 * =========================================================================
 * Target location in DefiLlama's monorepo:  dimension-adapters/dexs/hookswap/index.ts
 * Adapter system:                           Volume + Fees   (github.com/DefiLlama/dimension-adapters)
 *
 * One dimension-adapter file yields BOTH the /dexs (volume) and /fees dashboards: `uniV2Exports`
 * reads on-chain Swap events from every HookSwap v2 pair and derives dailyVolume, and with the pool
 * fee it also derives dailyFees / supply-side revenue.
 *
 * DATA SOURCE = on-chain Swap event logs (idiomatic for a univ2 fork with no public subgraph).
 * HookSwap self-hosts a data-api (data.hookswap.org /v1/stats returns USD volume) but DefiLlama's
 * dimension framework expects on-chain-derived, DefiLlama-priced numbers, so we use the log path.
 *
 * VERIFIED LIVE (2026-07-15, facts-only):
 *   - HookSwap v2 pools on Robinhood (4663) charge 0.30% (feeTier 3000) — data.hookswap.org
 *     /v1/pools returns "feeTier":3000 for both live pairs. So fees = 0.003.
 *   - v2Factory 0xD1Cf66..6B45 allPairsLength() == 2 (WETH/tHOOK, WETH/USDG).
 *   - data.hookswap.org /v1/stats?chainId=4663 currently reports v2 30d volume ~$2.59 (thin seed
 *     liquidity) — real, non-zero, non-fabricated. On-chain Swap logs are the same events.
 */

import { uniV2Exports } from '../../helpers/uniswap'

// -------------------------------------------------------------------------------------------------
// CHAIN — dimension-adapters/helpers/chains.ts defines CHAIN.ROBINHOOD = 'robinhood'.
// IMPORTANT (see README "Chain-slug discrepancy"): the @defillama/sdk build we inspected exposes the
// Robinhood RPC under provider key 'robinhoodchain' (chainId 4663), while the dimension-adapters
// CHAIN enum value is 'robinhood'. Whichever string the dimension-adapters harness uses to resolve an
// RPC must match a providers.json key. This is verifiable ONLY by running the repo locally
// (`npm test -- hookswap`), which we cannot do here. Kept as one constant so it is a 1-line change.
// -------------------------------------------------------------------------------------------------
const CHAIN = 'robinhood'

// From contracts/deployments/robinhood.json:
const V2_FACTORY = '0xD1Cf664944173140AFc302c169eFD55c24966B45'

// Protocol start (unix seconds). Lower bound = Robinhood Chain genesis: block 1 timestamp read live
// from the RPC = 1777567931 (~2026-04-30). Safe over-estimate (no HookSwap pairs pre-date it, so
// backfill finds nothing earlier). Refine to the exact v2Factory deploy block/timestamp if wanted.
const START = 1777567931

const adapter = uniV2Exports(
  {
    [CHAIN]: {
      factory: V2_FACTORY,
      fees: 0.003, // HookSwap v2 swap fee = 0.30% (verified: data-api feeTier 3000)
      start: START,
    },
  },
  {
    methodology: {
      Volume: 'Sum of the token amounts swapped through every HookSwap v2 pair (UniswapV2 Swap events) on Robinhood Chain (4663), priced by DefiLlama.',
      Fees: 'Swap volume x 0.30% (the HookSwap v2 pool fee).',
      SupplySideRevenue: 'All 0.30% of swap fees accrue to liquidity providers (standard UniswapV2 fork; no protocol fee switch enabled).',
      Revenue: 'None taken by the protocol at the v2 pool level (feeTo not set).',
    },
  },
)

export default adapter

/*
 * v3 (add when v3 pools exist): import { uniV3Exports } from '../../helpers/uniswap' and export a
 * combined adapter. v3Factory (Robinhood) = 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3. Currently no
 * v3 pools exist on any HookSwap chain, so v3 is omitted.
 *
 * OTHER HOOKSWAP CHAINS (factories deployed, RPC present in @defillama/sdk — enable per chain once
 * on-chain v2 pairs are confirmed; add each as another `[CHAIN.X]: { factory, fees: 0.003, start }`):
 *   MegaETH 4326 ('megaeth') v2 0xD1Cf66..6B45 | Ink 57073 ('ink') v2 0xD1Cf66..6B45 |
 *   XLayer 196 ('xlayer') v2 0xD1Cf66..6B45 | HyperEVM 999 ('hyperliquid') v2 0xB92598Fa..60B2 |
 *   Tempo 4217 ('tempo') v2 0xE8526A04..7EE4
 */

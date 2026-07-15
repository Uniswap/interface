/*
 * HookSwap — TVL adapter (DefiLlama-Adapters convention)
 * =====================================================
 * Target location in DefiLlama's monorepo:  DefiLlama-Adapters/projects/hookswap/index.js
 * Adapter system:                           TVL   (github.com/DefiLlama/DefiLlama-Adapters)
 *
 * HookSwap on-chain is a standard Uniswap **v2 + v3** fork stack (supportsV4:false — NO v4/hooks
 * on-chain). It runs its OWN factories/routers per chain; addresses below are copied verbatim from
 * this repo's contracts/deployments/<chain>.json and MUST be treated as the source of truth.
 *
 * DATA SOURCE = raw on-chain reads (the idiomatic DefiLlama path), NOT a subgraph and NOT the
 * HookSwap data-api. `getUniTVL` enumerates every v2 pair via allPairsLength()/allPairs() on the
 * factory and sums pair reserves; DefiLlama prices the underlying tokens with its own coins service.
 *
 * VERIFIED LIVE (2026-07-15, facts-only):
 *   - v2Factory 0xD1Cf66..6B45 allPairsLength() == 2 on RPC https://rpc.mainnet.chain.robinhood.com
 *   - eth_chainId == 0x1237 == 4663
 *   - DefiLlama coins already prices the two real tokens on this chain:
 *       WETH  -> ~$1924.98   (robinhood:0x0Bd7D308..)
 *       USDG  -> ~$1.0019    (robinhoodchain:0x5fc5360D..)   [Global Dollar]
 *     tHOOK (0x3b5a01Ef.., a test token) has NO market -> DefiLlama prices it 0. That is honest,
 *     not fabricated: only genuinely-priced reserves contribute USD TVL.
 */

const { getUniTVL } = require('../helper/unknownTokens')

// -------------------------------------------------------------------------------------------------
// CHAIN KEY — this MUST be a key in @defillama/sdk's build/providers.json (that is what carries the
// chainId + RPC used for the on-chain reads). Verified in the published sdk build:
//   "robinhoodchain": { rpc: ["https://rpc.mainnet.chain.robinhood.com"], chainId: 4663 }
// (exact RPC match to contracts/deployments/robinhood.json).
//
// NOTE / open item for the DefiLlama PR: DefiLlama-Adapters/projects/helper/chains.json instead lists
// the slug "robinhood" (no "chain" suffix). The RPC-bearing sdk provider key is "robinhoodchain".
// If DefiLlama's TVL harness keys the RPC off the module.exports chain name, it must resolve
// "robinhoodchain"; if it keys off chains.json it expects "robinhood". These two must be reconciled
// with the maintainers (see README "Chain-slug discrepancy"). Change is a single constant here.
// -------------------------------------------------------------------------------------------------
const CHAIN = 'robinhoodchain'

// From contracts/deployments/robinhood.json (do NOT edit from memory — re-read that file):
const V2_FACTORY = '0xD1Cf664944173140AFc302c169eFD55c24966B45'
// v3 is deployed but currently has ZERO pools (data-api /v1/pools returns only PROTOCOL_VERSION_V2),
// so it is intentionally left OFF to avoid a full PoolCreated log scan that would return nothing.
// To enable once v3 liquidity is seeded, fill V3_FROM_BLOCK with the v3Factory deploy block and
// uncomment the mergeExports block below.
// const V3_FACTORY   = '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3'
// const V3_FROM_BLOCK = 0 // TODO: exact UniswapV3Factory deploy block on Robinhood (4663)

module.exports = {
  methodology:
    'TVL = the on-chain token reserves of every HookSwap v2 (UniswapV2Factory) pair on Robinhood ' +
    'Chain (chainId 4663), enumerated via allPairsLength()/allPairs() on the factory and priced by ' +
    'DefiLlama. HookSwap is an own-deployed Uniswap v2+v3 fork (supportsV4:false). The v3 ' +
    '(UniswapV3Factory 0xAa1f5B..) TVL export is wired but disabled because there are no v3 pools ' +
    'yet; test/unlisted tokens with no market price contribute $0.',

  [CHAIN]: {
    tvl: getUniTVL({
      chain: CHAIN,
      factory: V2_FACTORY,
      useDefaultCoreAssets: true, // no-op if robinhoodchain isn't in coreAssets.json -> raw reserve sum (still correct)
    }),
  },
}

// -------------------------------------------------------------------------------------------------
// v3 (enable when v3 pools exist). Combines v2 + v3 per-chain tvl via mergeExports:
//
// const { uniV3Export } = require('../helper/uniswapV3')
// const { mergeExports } = require('../helper/utils')
// const v2 = { [CHAIN]: { tvl: getUniTVL({ chain: CHAIN, factory: V2_FACTORY, useDefaultCoreAssets: true }) } }
// const v3 = uniV3Export({ [CHAIN]: { factory: V3_FACTORY, fromBlock: V3_FROM_BLOCK } })
// module.exports = mergeExports([v2, v3])
// module.exports.methodology = '...(as above, plus v3 concentrated-liquidity pool balances)...'
// -------------------------------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// OTHER HOOKSWAP CHAINS — factories are deployed (addresses below verified from
// contracts/deployments/<chain>.json) and each chain's RPC IS present in @defillama/sdk providers.json
// (provider key in brackets). They are NOT enabled here because HookSwap liquidity on them is not
// verified live yet (only Robinhood has confirmed on-chain pairs at time of writing). To add one:
// confirm allPairsLength() > 0 on its factory, then add a `[providerKey]: { tvl: getUniTVL(...) }` entry.
//
//   MegaETH  (4326)  [sdk key 'megaeth']      v2 0xD1Cf664944173140AFc302c169eFD55c24966B45  v3 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3
//   Ink      (57073) [sdk key 'ink']          v2 0xD1Cf664944173140AFc302c169eFD55c24966B45  v3 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3
//   XLayer   (196)   [sdk key 'xlayer']       v2 0xD1Cf664944173140AFc302c169eFD55c24966B45  v3 0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC
//   HyperEVM (999)   [sdk key 'hyperliquid']  v2 0xB92598Fa464B96FEC394a17A269Ad18060Ec60B2  v3 0x45DB3eaE624dBcA631A9C6C1406DA0B8F6Fb275A
//   Tempo    (4217)  [sdk key 'tempo']        v2 0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4  v3 0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3
// -------------------------------------------------------------------------------------------------

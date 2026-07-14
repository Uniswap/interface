/**
 * HookSwap Terminal — v2 pool (create + seed liquidity) contract addresses.
 *
 * FACTS-ONLY: the entries below are REAL deployed HookSwap contracts, read straight
 * from `contracts/deployments/<chain>.json` — the own v2 factory + v2 Router02 +
 * canonical wrapped-native (WETH-equivalent) reused per chain. The v2 Router02 pulls
 * the deposited tokens via a plain ERC-20 `allowance` (NO Permit2), and `addLiquidity`
 * creates the pair on the first add, so client-side pool creation needs only these
 * three addresses.
 *
 * A chain with NO entry (or `undefined`) has no v2 stack wired here yet; the Pools
 * screen then renders an honest "Pool creation isn't available on {chain} yet" state
 * — never fabricated data. To light up another chain, add its `{ v2Router02,
 * v2Factory, weth }` from that chain's deployments JSON.
 *
 * Robinhood (4663) verified from contracts/deployments/robinhood.json.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

export interface PoolContractAddresses {
  /** Own UniswapV2Router02 — approve tokens to this, then addLiquidity / addLiquidityETH. */
  v2Router02: Address
  /** Own UniswapV2Factory — getPair (first-LP detection) / createPair. */
  v2Factory: Address
  /** Canonical wrapped-native (WETH-equivalent). The native-ETH pair is a WETH pair. */
  weth: Address
}

/**
 * Per-chain v2 pool contract addresses. Robinhood-only for now (launch scope);
 * structured so other HookSwap chains can be added from their deployments JSON.
 */
export const POOL_ADDRESSES: Partial<Record<UniverseChainId, PoolContractAddresses>> = {
  // Robinhood (4663) — contracts/deployments/robinhood.json
  [UniverseChainId.Robinhood]: {
    v2Router02: '0xBe3729d06E3A17F3c7c5ac394c7bCbe138B6EEFA',
    v2Factory: '0xD1Cf664944173140AFc302c169eFD55c24966B45',
    weth: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  },
}

/**
 * v2 pool addresses for a chain, or `undefined` when the chain has no v2 stack wired
 * here. Callers treat a missing config as an honest "not available" state.
 */
export function getPoolAddresses(chainId?: number): PoolContractAddresses | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return POOL_ADDRESSES[chainId as UniverseChainId]
}

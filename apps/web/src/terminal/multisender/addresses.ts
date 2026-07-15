/**
 * HookSwap Terminal — Multisender (Disperse) contract addresses (config-driven).
 *
 * FACTS-ONLY: `Disperse` is the stateless batch-send contract (see
 * `contracts/multisender/src/Disperse.sol`) — no owner, no fees. It is NOT yet deployed,
 * so every entry is intentionally UNSET. Do NOT invent an address: a chain with no entry
 * (or `undefined`) renders an honest "Multisender isn't deployed on {chain} yet" state —
 * never fabricated data.
 *
 * When Reggie deploys Disperse, fill the address below (from the deploy output /
 * `contracts/deployments/robinhood.json` `"disperse"`) and the screen lights up
 * automatically — no other change needed. Mirrors `~/terminal/pools/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `Disperse` addresses. Robinhood-only launch scope; structured so
 * other HookSwap chains can be added from their deploy output.
 */
export const DISPERSE_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0xddb6a9b9e2d6c5636b444c0cda907c9944c6cec7',
}

/**
 * Deployed `Disperse` address for a chain, or `undefined` when it isn't deployed there
 * yet. Callers treat a missing address as an honest "not deployed" state.
 */
export function getDisperseAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return DISPERSE_ADDRESSES[chainId as UniverseChainId]
}

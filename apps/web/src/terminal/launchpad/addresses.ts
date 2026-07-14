/**
 * HookSwap Terminal — Launchpad (InstantPoolLauncherV2) contract addresses.
 *
 * FACTS-ONLY: `InstantPoolLauncherV2` is the one-shot pool launcher (factory) — a single
 * `launch(cfg)` deploys a fresh token, opens a v3 pool, and (optionally) does the creator's
 * dev-buy in the same tx. The verified Robinhood-mainnet deploy is at
 * `0xCCaA39560A7B305d179beA4255BAD0460decA3Bd`.
 *
 * DESIGN-ONLY: the Robinhood entry is intentionally left UNSET (commented out) so this
 * feature ships as a ready-to-flip-live deliverable — `getLaunchpadAddress()` returns
 * `undefined`, and the screen renders the honest "not deployed" state instead of driving a
 * live contract. Flip it live by UNCOMMENTING the Robinhood line below (no other change to
 * this file needed). Mirrors `~/terminal/tokenfactory/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `InstantPoolLauncherV2` addresses. Robinhood-only launch scope;
 * structured so other HookSwap chains can be added from their deploy output.
 */
export const LAUNCHPAD_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  // Robinhood (4663) — InstantPoolLauncherV2 verified on-chain at
  //   0xCCaA39560A7B305d179beA4255BAD0460decA3Bd
  // design-only — flip live by uncommenting the line below.
  // [UniverseChainId.Robinhood]: '0xCCaA39560A7B305d179beA4255BAD0460decA3Bd',
}

/**
 * Deployed `InstantPoolLauncherV2` address for a chain, or `undefined` when it isn't
 * wired here yet (which — being design-only — it currently is for every chain). Callers
 * treat a missing address as an honest "not deployed" state.
 */
export function getLaunchpadAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return LAUNCHPAD_ADDRESSES[chainId as UniverseChainId]
}

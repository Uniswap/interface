/**
 * HookSwap Terminal — Locker contract addresses (config-driven).
 *
 * FACTS-ONLY: these are DELIBERATELY UNSET. The locker contracts
 * (HookSwapTokenLockerManager + HookSwapV3PositionLocker) are being built at
 * `contracts/locker/` and are NOT deployed yet on any chain. Until they are, every
 * entry stays `undefined` and the Locker screen renders an honest
 * "Lockers aren't deployed on {chain} yet" state — never fabricated data.
 *
 * When a chain's locker contracts deploy, fill its addresses below (from
 * `contracts/deployments/<chain>.json` or the locker deploy output) and the screen
 * lights up automatically — no other change needed.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

export interface LockerAddresses {
  /** HookSwapTokenLockerManager — ERC-20 + Uniswap-V2 LP locks. */
  tokenLockerManager?: Address
  /** HookSwapV3PositionLocker — Uniswap v3 position-NFT locks. */
  v3PositionLocker?: Address
}

/**
 * Per-chain locker deployment addresses for the 7 HookSwap chains.
 * All UNSET for now — filled after the `contracts/locker` deploy.
 */
export const LOCKER_ADDRESSES: Partial<Record<UniverseChainId, LockerAddresses>> = {
  // HyperEVM (999)
  [UniverseChainId.HyperEvm]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // Ink (57073)
  [UniverseChainId.Ink]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // MegaETH (4326)
  [UniverseChainId.MegaETH]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // XLayer (196)
  [UniverseChainId.XLayer]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // Robinhood (4663)
  [UniverseChainId.Robinhood]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // Tempo (4217)
  [UniverseChainId.Tempo]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
  // Sepolia (11155111)
  [UniverseChainId.Sepolia]: { tokenLockerManager: undefined, v3PositionLocker: undefined },
}

/**
 * Locker addresses for a chain. Returns `undefined` when the chain has no locker
 * config at all; a present config may still have `undefined` inner addresses (not
 * yet deployed). Callers treat a missing address as an honest "not deployed" state.
 */
export function getLockerAddresses(chainId?: number): LockerAddresses | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return LOCKER_ADDRESSES[chainId as UniverseChainId]
}

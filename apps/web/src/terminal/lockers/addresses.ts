/**
 * HookSwap Terminal — Locker contract addresses (config-driven).
 *
 * FACTS-ONLY: the entries below are REAL deployed HookSwapTokenLockerManager /
 * HookSwapV3PositionLocker contracts. The deployer used deterministic CREATE
 * (same key + nonce across chains), so several chains share the same address —
 * that is expected, not a copy/paste bug. Verified live on Robinhood (4663):
 * `eth_getCode` returns real bytecode for both lockers and `lockFee()` on the
 * manager returns 0.04 native (2026-07-10).
 *
 * A chain with NO entry (or an `undefined` inner address) has no locker yet; the
 * Locker screen then renders an honest "Lockers aren't deployed on {chain} yet"
 * state — never fabricated data. When a new chain's lockers deploy, fill its
 * addresses below (from `contracts/deployments/<chain>.json` or the locker deploy
 * output) and the screen lights up automatically — no other change needed.
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
  [UniverseChainId.HyperEvm]: {
    tokenLockerManager: '0x7EFFe9DD68035f43ad43aE6C31bc1a47Ab4579D0',
    v3PositionLocker: '0xD08E609277eCB0B7E2eF15dF5C1Fb11436627a63',
  },
  // Ink (57073)
  [UniverseChainId.Ink]: {
    tokenLockerManager: '0x86426094d82bC1fd40F0901965b23D30837Dc66b',
    v3PositionLocker: '0xB5A7BF488f2407479E116f713f116546F67c803b',
  },
  // MegaETH (4326)
  [UniverseChainId.MegaETH]: {
    tokenLockerManager: '0x35dB40f22143651159056285E92c113ECE65E7e2',
    v3PositionLocker: '0x86426094d82bC1fd40F0901965b23D30837Dc66b',
  },
  // XLayer (196)
  [UniverseChainId.XLayer]: {
    tokenLockerManager: '0x35dB40f22143651159056285E92c113ECE65E7e2',
    v3PositionLocker: '0x86426094d82bC1fd40F0901965b23D30837Dc66b',
  },
  // Robinhood (4663)
  [UniverseChainId.Robinhood]: {
    tokenLockerManager: '0x35dB40f22143651159056285E92c113ECE65E7e2',
    v3PositionLocker: '0x86426094d82bC1fd40F0901965b23D30837Dc66b',
  },
  // Tempo (4217)
  [UniverseChainId.Tempo]: {
    tokenLockerManager: '0x86426094d82bC1fd40F0901965b23D30837Dc66b',
    v3PositionLocker: '0xB5A7BF488f2407479E116f713f116546F67c803b',
  },
  // Sepolia (11155111) — DEPLOYED 2026-07-05, lock fee 0.04 native (adjustable).
  [UniverseChainId.Sepolia]: {
    tokenLockerManager: '0xAa1f5Bd529Be345e7FB77934554112E5ecd7D7f3',
    v3PositionLocker: '0xAB34Bb3767020059A35e71D03f13E9e4fbCD07aC',
  },
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

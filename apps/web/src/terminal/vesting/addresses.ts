/**
 * HookSwap Terminal — Vesting (HookSwapVestingManager) contract addresses.
 *
 * FACTS-ONLY: `HookSwapVestingManager` is the self-service token-vesting factory + registry
 * (see `contracts/vesting/src/HookSwapVestingManager.sol`) — anyone can call
 * `createVesting(token, beneficiary, amount, startTime, cliffDuration, duration)` to deploy a
 * funded `HookSwapVesting` child that releases tokens to the beneficiary on a cliff + linear
 * curve. The contract is built + Sepolia-tested, but its Robinhood-mainnet deploy is PENDING,
 * so every entry here is intentionally UNSET. Do NOT invent an address: a chain with no entry
 * (or `undefined`) renders an honest "Vesting isn't deployed on {chain} yet" state — never
 * fabricated data.
 *
 * When Reggie deploys HookSwapVestingManager, fill the address below (from the deploy output /
 * `contracts/deployments/robinhood.json` `"vestingManager"`) and the screen lights up
 * automatically — no other change needed. Mirrors `~/terminal/tokenfactory/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `HookSwapVestingManager` addresses. Robinhood-only launch scope;
 * structured so other HookSwap chains can be added from their deploy output.
 */
export const VESTING_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0x7f91048007b653b088282a73d180541f9c228677',
  // Suite mirror deployed 2026-07-16 (see contracts/deployments/<chain>-suite.json).
  [UniverseChainId.HyperEvm]: '0x7f91048007b653b088282a73d180541f9c228677',
  [UniverseChainId.XLayer]: '0xb8b8e647259d5de25754278878893456c72c2a56',
  [UniverseChainId.MegaETH]: '0x7effe9dd68035f43ad43ae6c31bc1a47ab4579d0',
  [UniverseChainId.Ink]: '0x250c3448278f7b71e3e9b641f2efeb6074820e25',
  [UniverseChainId.Tempo]: '0xd08e609277ecb0b7e2ef15df5c1fb11436627a63',
}

/**
 * Deployed `HookSwapVestingManager` address for a chain, or `undefined` when it isn't
 * deployed there yet. Callers treat a missing address as an honest "not deployed" state.
 */
export function getVestingAddress(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return VESTING_ADDRESSES[chainId as UniverseChainId]
}

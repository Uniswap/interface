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

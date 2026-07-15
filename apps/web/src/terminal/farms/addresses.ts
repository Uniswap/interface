/**
 * HookSwap Terminal — Farms (StakingRewardsFactory) contract addresses.
 *
 * FACTS-ONLY: `StakingRewardsFactory` is the self-service staking-farm deployer
 * (see `contracts/farms/src/StakingRewardsFactory.sol`) — anyone can call
 * `createAndFund(stakingToken, rewardToken, rewardAmount, duration)` to deploy a funded
 * `StakingRewards` child that streams `rewardToken` to stakers over `duration`. The
 * contract is built + audited + Sepolia-tested, but its Robinhood-mainnet deploy is
 * PENDING, so every entry here is intentionally UNSET. Do NOT invent an address: a chain
 * with no entry (or `undefined`) renders an honest "Farms aren't deployed on {chain} yet"
 * state — never fabricated data.
 *
 * When Reggie deploys StakingRewardsFactory, fill the address below (from the deploy output /
 * `contracts/deployments/robinhood.json` `"stakingRewardsFactory"`) and the screen lights up
 * automatically — no other change needed. Mirrors `~/terminal/vesting/addresses.ts`.
 */

import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { Address } from '~/chains'

/**
 * Per-chain deployed `StakingRewardsFactory` addresses. Robinhood-only launch scope;
 * structured so other HookSwap chains can be added from their deploy output.
 */
export const FARM_FACTORY_ADDRESSES: Partial<Record<UniverseChainId, Address>> = {
  [UniverseChainId.Robinhood]: '0x8d26aa9d0556fd1483ad630fe9f6e21c168f2e33',
}

/**
 * Deployed `StakingRewardsFactory` address for a chain, or `undefined` when it isn't
 * deployed there yet. Callers treat a missing address as an honest "not deployed" state.
 */
export function getFarmFactory(chainId?: number): Address | undefined {
  if (chainId === undefined) {
    return undefined
  }
  return FARM_FACTORY_ADDRESSES[chainId as UniverseChainId]
}

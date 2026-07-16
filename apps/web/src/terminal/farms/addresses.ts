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
  // Suite mirror deployed 2026-07-16 (see contracts/deployments/<chain>-suite.json).
  [UniverseChainId.HyperEvm]: '0x8d26aa9d0556fd1483ad630fe9f6e21c168f2e33',
  [UniverseChainId.XLayer]: '0x7f91048007b653b088282a73d180541f9c228677',
  [UniverseChainId.MegaETH]: '0xd9d4795f2a12305a12c36455adad011f2d6143ab',
  [UniverseChainId.Ink]: '0x144331bb4c3026d135896cafec3ae3d667f4f376',
  [UniverseChainId.Tempo]: '0x250c3448278f7b71e3e9b641f2efeb6074820e25',
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

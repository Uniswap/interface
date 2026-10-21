import type { PlainMessage } from '@bufbuild/protobuf'
import { RewardBalance } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { LiquidityServicePosition, PositionRewardApr } from 'uniswap/src/features/positions/types'

/**
 * The pool's live LP-incentive boosts and the position's unclaimed balances, two orthogonal views of
 * the one served `rewards` list: an ended campaign leaves a balance with no live boost, and a live
 * boost can have accrued nothing. Each comes back undefined rather than empty so callers gate on
 * presence alone. An entry with no token is dropped from both (the amounts are denominated in it),
 * and a balance also needs decimals — optional here — to scale its raw amount.
 */
export function parseLiquidityServiceRewards(position: LiquidityServicePosition): {
  rewards?: PositionRewardApr[]
  rewardBalances?: PlainMessage<RewardBalance>[]
} {
  // The generated type promises an array, but protobuf JSON omits empty repeated fields, so this is
  // absent whenever the pool runs no campaign. Cast to the truthful type; without it, guards on it
  // read as dead code.
  const served = (position.rewards as LiquidityServicePosition['rewards'] | undefined) ?? []
  const rewards: PositionRewardApr[] = []
  const rewardBalances: PlainMessage<RewardBalance>[] = []
  for (const { token, boostedPoolApr, unclaimedAmount, unclaimedAmountUsd } of served) {
    if (!token) {
      continue
    }
    // Destructured rather than spread: the two outputs take different token shapes. PositionRewardApr has
    // no `name`, and RewardBalance requires the `symbol`/`name` the served token leaves optional.
    const { chainId, address, symbol, decimals, name, isNative } = token
    if (boostedPoolApr > 0) {
      rewards.push({ token: { chainId, address, symbol, decimals, isNative }, boostedPoolApr })
    }
    if (unclaimedAmount !== undefined && decimals !== undefined) {
      rewardBalances.push({
        token: { chainId, address, symbol: symbol ?? '', decimals, name: name ?? '', isNative },
        unclaimedAmount,
        unclaimedAmountUsd,
      })
    }
  }

  return {
    rewards: rewards.length > 0 ? rewards : undefined,
    rewardBalances: rewardBalances.length > 0 ? rewardBalances : undefined,
  }
}

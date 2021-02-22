import BigNumber from 'bignumber.js'
import { NonExpiredLiquidityMiningCampaign } from '../apollo/queries'

export function getPairRemainingRewardsUSD(
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[],
  ethUSDPrice: BigNumber
): BigNumber {
  const now = Math.floor(Date.now() / 1000)
  // no liquidity mining campaigns check
  if (liquidityMiningCampaigns.length === 0) return new BigNumber(0)
  return liquidityMiningCampaigns.reduce((remainingRewardsUSDForPair: BigNumber, liquidityMiningCampaign) => {
    const {
      duration: stringDuration,
      startsAt: stringStartsAt,
      endsAt: stringEndsAt,
      rewardAmounts,
      rewardTokens
    } = liquidityMiningCampaign
    const duration = parseInt(stringDuration)
    const startsAt = parseInt(stringStartsAt)
    const endsAt = parseInt(stringEndsAt)
    const rewardsPerSecondUSD = rewardTokens.reduce(
      (accumulator: BigNumber, rewardToken, index) =>
        accumulator.plus(
          new BigNumber(rewardAmounts[index])
            .multipliedBy(rewardToken.derivedETH)
            .multipliedBy(ethUSDPrice)
            .dividedBy(duration)
        ),
      new BigNumber(0)
    )
    if (now < startsAt) {
      remainingRewardsUSDForPair.plus(rewardsPerSecondUSD.multipliedBy(duration))
    } else {
      const remainingDuration = endsAt - now
      remainingRewardsUSDForPair.plus(rewardsPerSecondUSD.multipliedBy(remainingDuration))
    }
    return remainingRewardsUSDForPair
  }, new BigNumber(0))
}

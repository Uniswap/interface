import BigNumber from 'bignumber.js'
import { NonExpiredLiquidityMiningCampaign } from '../apollo/queries'

export function getPairRemainingRewardsUSD(
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[],
  ethUSDPrice: BigNumber
): BigNumber {
  const now = Math.floor(Date.now() / 1000)
  // no liquidity mining campaigns check
  if (liquidityMiningCampaigns.length === 0) return new BigNumber(0)
  return liquidityMiningCampaigns.reduce((accumulator, liquidityMiningCampaign) => {
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
    if (now >= endsAt) {
      // the campaign is expired, no more rewards to give out
      return accumulator
    }
    const remainingDistributionProgress =
      now < startsAt ? new BigNumber('1') : new BigNumber('1').minus(new BigNumber(now - startsAt).dividedBy(duration))
    let remainingRewardsUSD = new BigNumber(0)
    for (let i = 0; i < rewardTokens.length; i++) {
      const remainingReward = new BigNumber(rewardAmounts[i]).multipliedBy(remainingDistributionProgress)
      remainingRewardsUSD = remainingRewardsUSD.plus(
        new BigNumber(rewardTokens[i].derivedETH).multipliedBy(ethUSDPrice).multipliedBy(remainingReward)
      )
    }
    return accumulator.plus(remainingRewardsUSD)
  }, new BigNumber(0))
}

import BigNumber from 'bignumber.js'

export function getPairRemainingRewardsUSD(liquidityMiningCampaigns: any[], ethUSDPrice: BigNumber): BigNumber {
  const now = Math.floor(Date.now() / 1000)
  // no liquidity mining campaigns check
  if (liquidityMiningCampaigns.length === 0) return new BigNumber(0)
  return liquidityMiningCampaigns.reduce((remainingRewardsUSDForPair: BigNumber, liquidityMiningCampaign: any) => {
    const {
      duration: stringDuration,
      startsAt: stringStartsAt,
      endsAt: stringEndsAt,
      rewards
    } = liquidityMiningCampaign
    const duration = parseInt(stringDuration)
    const startsAt = parseInt(stringStartsAt)
    const endsAt = parseInt(stringEndsAt)
    const rewardsPerSecondUSD = rewards.reduce(
      (accumulator: BigNumber, reward: any) =>
        accumulator.plus(
          new BigNumber(reward.amount)
            .multipliedBy(reward.token.derivedETH)
            .multipliedBy(ethUSDPrice)
            .dividedBy(reward.duration)
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

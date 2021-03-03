import BigNumber from 'bignumber.js'
import { NonExpiredLiquidityMiningCampaign, NonExpiredLiquidityMiningCampaignRewardToken } from '../apollo/queries'

function getCurrentDistributionProgress(startsAt: number, duration: number) {
  const now = Math.floor(Date.now() / 1000)
  return now < startsAt
    ? new BigNumber('1')
    : new BigNumber('1').minus(new BigNumber(now - startsAt).dividedBy(duration))
}

export function getRemainingRewardsUSD(
  liquidityMiningCampaign: NonExpiredLiquidityMiningCampaign,
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  const now = Math.floor(Date.now() / 1000)
  // no liquidity mining campaigns check
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
  // the campaign is expired, no more rewards to give out
  if (now >= endsAt) return new BigNumber(0)
  const remainingDistributionProgress = getCurrentDistributionProgress(startsAt, duration)
  let remainingRewardsUSD = new BigNumber(0)
  for (let i = 0; i < rewardTokens.length; i++) {
    const remainingReward = new BigNumber(rewardAmounts[i]).multipliedBy(remainingDistributionProgress)
    remainingRewardsUSD = remainingRewardsUSD.plus(
      new BigNumber(rewardTokens[i].derivedNativeCurrency)
        .multipliedBy(nativeCurrencyUSDPrice)
        .multipliedBy(remainingReward)
    )
  }
  return remainingRewardsUSD
}

export function getPairRemainingRewardsUSD(
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[],
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  // no liquidity mining campaigns check
  if (liquidityMiningCampaigns.length === 0) return new BigNumber(0)
  return liquidityMiningCampaigns.reduce(
    (accumulator, liquidityMiningCampaign) =>
      accumulator.plus(getRemainingRewardsUSD(liquidityMiningCampaign, nativeCurrencyUSDPrice)),
    new BigNumber(0)
  )
}

// the minimum USD amount to calculate APY (otherwise, when no stake is in there, apy would be infinite)
const MINIMUM_STAKED_AMOUNT_USD = new BigNumber(100)

export function getCampaignApy(
  pairReserveNativeCurrency: BigNumber,
  liquidityTokenTotalSupply: BigNumber,
  duration: string,
  startsAt: string,
  rewardTokens: NonExpiredLiquidityMiningCampaignRewardToken[],
  rewardAmounts: string[],
  stakedAmount: string,
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  const numericStartsAt = parseInt(startsAt)
  const numericDuration = parseInt(duration)

  const remainingDistributionProgress = getCurrentDistributionProgress(numericStartsAt, numericDuration)
  const remainingRewardAmountUSD = rewardAmounts.reduce((remainingAmount: BigNumber, fullAmount, index) => {
    const remainingReward = new BigNumber(fullAmount).multipliedBy(remainingDistributionProgress)
    return remainingAmount.plus(
      new BigNumber(rewardTokens[index].derivedNativeCurrency)
        .multipliedBy(nativeCurrencyUSDPrice)
        .multipliedBy(remainingReward)
    )
  }, new BigNumber(0))

  let stakedValueUSD = pairReserveNativeCurrency
    .multipliedBy(nativeCurrencyUSDPrice)
    .dividedBy(liquidityTokenTotalSupply)
    .multipliedBy(stakedAmount)
  stakedValueUSD = stakedValueUSD.isLessThan(MINIMUM_STAKED_AMOUNT_USD) ? MINIMUM_STAKED_AMOUNT_USD : stakedValueUSD

  const finalValueWithAccruedRewardsUSD = stakedValueUSD.plus(remainingRewardAmountUSD)
  const yieldInPeriod = finalValueWithAccruedRewardsUSD
    .minus(stakedValueUSD)
    .div(finalValueWithAccruedRewardsUSD.plus(stakedValueUSD).div(new BigNumber(2)))

  return new BigNumber(duration)
    .dividedBy(31557600) // seconds in a year
    .multipliedBy(yieldInPeriod)
    .multipliedBy(100)
}

export function getPairMaximumApy(
  pairReserveNativeCurrency: BigNumber,
  liquidityTokenTotalSupply: BigNumber,
  liquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[],
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  // no liquidity mining campaigns check
  if (liquidityMiningCampaigns.length === 0) return new BigNumber(0)
  return liquidityMiningCampaigns.reduce((maximumApy, liquidityMiningCampaign) => {
    const apy = getCampaignApy(
      pairReserveNativeCurrency,
      liquidityTokenTotalSupply,
      liquidityMiningCampaign.duration,
      liquidityMiningCampaign.startsAt,
      liquidityMiningCampaign.rewardTokens,
      liquidityMiningCampaign.rewardAmounts,
      liquidityMiningCampaign.stakedAmount,
      nativeCurrencyUSDPrice
    )
    return apy.isGreaterThan(maximumApy) ? apy : maximumApy
  }, new BigNumber(0))
}

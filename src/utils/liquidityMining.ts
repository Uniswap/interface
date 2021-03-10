import BigNumber from 'bignumber.js'
import { NonExpiredLiquidityMiningCampaign, NonExpiredLiquidityMiningCampaignRewardToken } from '../apollo/queries'

function getRemainingDistributionPercentage(startsAt: number, endsAt: number) {
  const duration = endsAt - startsAt
  const now = Math.floor(Date.now() / 1000)
  return now < startsAt ? new BigNumber('1') : new BigNumber(now - startsAt).dividedBy(duration)
}

export function getRemainingRewardsUSD(
  startsAt: number,
  endsAt: number,
  rewardAmounts: string[],
  rewardTokens: NonExpiredLiquidityMiningCampaignRewardToken[],
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  const now = Math.floor(Date.now() / 1000)
  // the campaign is expired, no more rewards to give out
  if (now >= endsAt) return new BigNumber(0)
  const remainingDistributionPercentage = getRemainingDistributionPercentage(startsAt, endsAt)
  let remainingRewardsUSD = new BigNumber(0)
  for (let i = 0; i < rewardTokens.length; i++) {
    const remainingReward = new BigNumber(rewardAmounts[i]).multipliedBy(remainingDistributionPercentage)
    remainingRewardsUSD = remainingRewardsUSD.plus(
      remainingReward.multipliedBy(rewardTokens[i].derivedNativeCurrency).multipliedBy(nativeCurrencyUSDPrice)
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
  return liquidityMiningCampaigns.reduce((accumulator, liquidityMiningCampaign) => {
    const { startsAt: stringStartsAt, endsAt: stringEndsAt, rewardAmounts, rewardTokens } = liquidityMiningCampaign
    const startsAt = parseInt(stringStartsAt)
    const endsAt = parseInt(stringEndsAt)
    return accumulator.plus(
      getRemainingRewardsUSD(startsAt, endsAt, rewardAmounts, rewardTokens, nativeCurrencyUSDPrice)
    )
  }, new BigNumber(0))
}

// the minimum USD amount to calculate APY (otherwise, when no stake is in there, apy would be infinite)
const MINIMUM_STAKED_AMOUNT_USD = new BigNumber(100)

export function getCampaignApy(
  pairReserveNativeCurrency: BigNumber,
  liquidityTokenTotalSupply: BigNumber,
  startsAt: string,
  endsAt: string,
  rewardTokens: NonExpiredLiquidityMiningCampaignRewardToken[],
  rewardAmounts: string[],
  stakedAmount: string,
  nativeCurrencyUSDPrice: BigNumber
): BigNumber {
  const numericStartsAt = parseInt(startsAt)
  const numericEndsAt = parseInt(endsAt)
  const duration = numericEndsAt - numericStartsAt
  console.log(numericStartsAt, numericEndsAt)

  const remainingRewardAmountUSD = getRemainingRewardsUSD(
    numericStartsAt,
    numericEndsAt,
    rewardAmounts,
    rewardTokens,
    nativeCurrencyUSDPrice
  )

  let stakedValueUSD = pairReserveNativeCurrency
    .multipliedBy(nativeCurrencyUSDPrice)
    .dividedBy(liquidityTokenTotalSupply)
    .multipliedBy(stakedAmount)
  stakedValueUSD = stakedValueUSD.isLessThan(MINIMUM_STAKED_AMOUNT_USD) ? MINIMUM_STAKED_AMOUNT_USD : stakedValueUSD

  const yieldInPeriod = remainingRewardAmountUSD.dividedBy(stakedValueUSD).multipliedBy(100)
  const annualizationMultiplier = new BigNumber(31557600) // seconds in a year
    .dividedBy(duration)
  return yieldInPeriod.multipliedBy(annualizationMultiplier)
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
      liquidityMiningCampaign.startsAt,
      liquidityMiningCampaign.endsAt,
      liquidityMiningCampaign.rewardTokens,
      liquidityMiningCampaign.rewardAmounts,
      liquidityMiningCampaign.stakedAmount,
      nativeCurrencyUSDPrice
    )
    return apy.isGreaterThan(maximumApy) ? apy : maximumApy
  }, new BigNumber(0))
}

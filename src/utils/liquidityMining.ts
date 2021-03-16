import Decimal from 'decimal.js'
import {
  CurrencyAmount,
  LiquidityMiningCampaign,
  Pair,
  Percent,
  Price,
  USD,
  ChainId,
  Currency,
  Token,
  PricedToken,
  PricedTokenAmount
} from 'dxswap-sdk'
import { parseUnits } from 'ethers/lib/utils'
import { NonExpiredLiquidityMiningCampaign } from '../apollo/queries'
import { ZERO_USD } from '../constants'
import { getLpTokenPrice } from './prices'

export function getRemainingRewardsUSD(
  campaign: LiquidityMiningCampaign,
  nativeCurrencyUSDPrice: Price
): CurrencyAmount {
  const remainingRewards = campaign.remainingRewards
  let remainingRewardsUSD = ZERO_USD
  for (let i = 0; i < remainingRewards.length; i++) {
    remainingRewardsUSD = remainingRewardsUSD.add(
      CurrencyAmount.usd(
        parseUnits(
          remainingRewards[i].nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toFixed(USD.decimals),
          USD.decimals
        ).toString()
      )
    )
  }
  return remainingRewardsUSD
}

export function getPairRemainingRewardsUSD(pair: Pair, nativeCurrencyUSDPrice: Price): CurrencyAmount {
  // no liquidity mining campaigns check
  if (pair.liquidityMiningCampaigns.length === 0) return ZERO_USD
  return pair.liquidityMiningCampaigns.reduce((accumulator, campaign) => {
    return accumulator.add(getRemainingRewardsUSD(campaign, nativeCurrencyUSDPrice))
  }, ZERO_USD)
}

export function getPairMaximumApy(pair: Pair): Percent {
  // no liquidity mining campaigns check
  if (pair.liquidityMiningCampaigns.length === 0) return new Percent('0', '100')
  return pair.liquidityMiningCampaigns.reduce((maximumApy, liquidityMiningCampaign) => {
    const apy = liquidityMiningCampaign.apy
    return liquidityMiningCampaign.apy.greaterThan(maximumApy) ? apy : maximumApy
  }, new Percent('0', '100'))
}

export function toLiquidityMiningCampaigns(
  chainId: ChainId,
  targetedPair: Pair,
  targetedPairLpTokenTotalSupply: string,
  targetedPairReserveNativeCurrency: string,
  rawLiquidityMiningCampaigns: NonExpiredLiquidityMiningCampaign[],
  nativeCurrency: Currency
): LiquidityMiningCampaign[] {
  return rawLiquidityMiningCampaigns.map(campaign => {
    const rewards = campaign.rewardTokens.map((rewardToken, index) => {
      const properRewardToken = new Token(
        chainId,
        rewardToken.address,
        parseInt(rewardToken.decimals),
        rewardToken.symbol,
        rewardToken.name
      )
      const rewardTokenPriceNativeCurrency = new Price(
        properRewardToken,
        nativeCurrency,
        parseUnits('1', nativeCurrency.decimals).toString(),
        parseUnits(
          new Decimal(rewardToken.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
          nativeCurrency.decimals
        ).toString()
      )
      const pricedRewardToken = new PricedToken(
        chainId,
        rewardToken.address,
        parseInt(rewardToken.decimals),
        rewardTokenPriceNativeCurrency,
        rewardToken.symbol,
        rewardToken.name
      )
      return new PricedTokenAmount(
        pricedRewardToken,
        parseUnits(campaign.rewardAmounts[index], rewardToken.decimals).toString()
      )
    })
    const lpTokenPriceNativeCurrency = getLpTokenPrice(
      targetedPair,
      nativeCurrency,
      targetedPairLpTokenTotalSupply,
      targetedPairReserveNativeCurrency
    )
    const stakedPricedToken = new PricedToken(
      chainId,
      targetedPair.liquidityToken.address,
      targetedPair.liquidityToken.decimals,
      lpTokenPriceNativeCurrency,
      targetedPair.liquidityToken.symbol,
      targetedPair.liquidityToken.name
    )
    const staked = new PricedTokenAmount(
      stakedPricedToken,
      parseUnits(campaign.stakedAmount, stakedPricedToken.decimals).toString()
    )
    return new LiquidityMiningCampaign(
      campaign.startsAt,
      campaign.endsAt,
      targetedPair,
      rewards,
      staked,
      campaign.locked,
      campaign.address
    )
  })
}

import Decimal from 'decimal.js-light'
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
  PricedTokenAmount,
  TokenAmount
} from '@swapr/sdk'
import { getAddress, parseUnits } from 'ethers/lib/utils'
import { SubgraphLiquidityMiningCampaign } from '../apollo'
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

export function toLiquidityMiningCampaign(
  chainId: ChainId,
  targetedPair: Pair,
  targetedPairLpTokenTotalSupply: string,
  targetedPairReserveNativeCurrency: string,
  campaign: SubgraphLiquidityMiningCampaign,
  nativeCurrency: Currency
): LiquidityMiningCampaign {
  const rewards = campaign.rewards.map(reward => {
    const rewardToken = new Token(
      chainId,
      getAddress(reward.token.address),
      parseInt(reward.token.decimals),
      reward.token.symbol,
      reward.token.name
    )
    const rewardTokenPriceNativeCurrency = new Price(
      rewardToken,
      nativeCurrency,
      parseUnits('1', nativeCurrency.decimals).toString(),
      parseUnits(
        new Decimal(reward.token.derivedNativeCurrency).toFixed(nativeCurrency.decimals),
        nativeCurrency.decimals
      ).toString()
    )
    const pricedRewardToken = new PricedToken(
      chainId,
      getAddress(rewardToken.address),
      rewardToken.decimals,
      rewardTokenPriceNativeCurrency,
      rewardToken.symbol,
      rewardToken.name
    )
    return new PricedTokenAmount(
      pricedRewardToken,
      parseUnits(new Decimal(reward.amount).toFixed(rewardToken.decimals), rewardToken.decimals).toString()
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
    getAddress(targetedPair.liquidityToken.address),
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
    new TokenAmount(
      targetedPair.liquidityToken,
      parseUnits(campaign.stakingCap, targetedPair.liquidityToken.decimals).toString()
    ),
    getAddress(campaign.address)
  )
}

export function toLiquidityMiningCampaigns(
  chainId: ChainId,
  targetedPair: Pair,
  targetedPairLpTokenTotalSupply: string,
  targetedPairReserveNativeCurrency: string,
  rawLiquidityMiningCampaigns: SubgraphLiquidityMiningCampaign[],
  nativeCurrency: Currency
): LiquidityMiningCampaign[] {
  return rawLiquidityMiningCampaigns.map(campaign =>
    toLiquidityMiningCampaign(
      chainId,
      targetedPair,
      targetedPairLpTokenTotalSupply,
      targetedPairReserveNativeCurrency,
      campaign,
      nativeCurrency
    )
  )
}

export function getStakedAmountUSD(campaign: LiquidityMiningCampaign, nativeCurrencyUSDPrice: Price): CurrencyAmount {
  return CurrencyAmount.usd(
    parseUnits(
      campaign.staked.nativeCurrencyAmount.multiply(nativeCurrencyUSDPrice).toFixed(USD.decimals),
      USD.decimals
    ).toString()
  )
}

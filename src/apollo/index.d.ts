export interface SubgraphLiquidityMiningCampaignRewardToken {
  derivedNativeCurrency: string
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface SubgraphLiquidityMiningCampaign {
  address: string
  duration: string
  startsAt: string
  endsAt: string
  rewardAmounts: string[]
  stakedAmount: string
  rewardTokens: SubgraphLiquidityMiningCampaignRewardToken[]
  locked: boolean
  stakingCap: string
}

export interface SubgraphLiquidityMiningCampaignRewardToken {
  derivedNativeCurrency: string
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface SubgraphLiquidityMiningCampaignReward {
  token: SubgraphLiquidityMiningCampaignRewardToken
  amount: string
}

export interface SubgraphLiquidityMiningCampaign {
  address: string
  duration: string
  startsAt: string
  endsAt: string
  rewards: SubgraphLiquidityMiningCampaignReward[]
  stakedAmount: string
  locked: boolean
  stakingCap: string
}

export interface SubgraphKpiToken {
  address: string
  symbol: string
  name: string
  totalSupply: string
  collateral: {
    token: {
      address: string
      symbol: string
      name: string
      decimals: string
    }
    amount: string
  }
}

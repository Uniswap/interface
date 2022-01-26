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
  stakablePair: {
    id: string
    reserveNativeCurrency: string
    reserveUSD: string
    totalSupply: string
    reserve0: string
    reserve1: string
    token0: SubgraphToken
    token1: SubgraphToken
  }
  liquidityMiningPositions: { id: string; stakedAmount: string }[]
}

export interface SubgraphSingleSidedStakingCampaign {
  id: string
  owner: string
  startsAt: string
  endsAt: string
  duration: string
  stakingCap: string
  locked: boolean
  stakeToken: {
    id: string
    symbol: string
    name: string
    decimals: string
    totalSupply: string
    derivedNativeCurrency: string
    tokenDayData: {
      dailyVolumeUSD: string
    }
  }
  rewards: SubgraphLiquidityMiningCampaignReward[]
  stakedAmount: string
  singleSidedStakingPositions: { id: string; stakedAmount: string }[]
}

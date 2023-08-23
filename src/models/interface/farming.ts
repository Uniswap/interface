import { BigNumber } from '@ethersproject/bignumber'

import { PoolChartSubgraph, TokenSubgraph } from './responseSubgraph'

export interface Deposit {
  L2tokenId: string
  enteredInEternalFarming: string
  eternalBonusEarned: string | number
  eternalBonusRewardToken: TokenSubgraph
  eternalEarned: string | number
  eternalEndTime: string
  eternalFarming: string | null
  eternalRewardToken: TokenSubgraph
  eternalStartTime: string
  id: string
  farmId: string
  limitFarming: null | string
  limitRewardToken: TokenSubgraph
  limitEarned: string | number
  limitBonusEarned: string | number
  limitBonusRewardToken: TokenSubgraph
  limitStartTime: number
  started: boolean
  limitEndTime: number
  createdAtTimestamp: number
  limitReward: string
  ended: boolean
  limitAvailable: boolean
  eternalAvailable: boolean
  liquidity: BigNumber
  onFarmingCenter: boolean
  owner: string
  pool: PoolChartSubgraph
  tickLower: number
  tickUpper: number
  token0: string
  token1: string
  l2TokenId: string | null
  tokensLockedEternal: string
  tokensLockedLimit: string
  tierEternal: string
  tierLimit: string
  multiplierToken: TokenSubgraph
  oldFarming?: boolean
  isDetached?: boolean
}

export interface FormattedRewardInterface {
  amount: number
  id: string
  name: string
  owner: string
  rewardAddress: string
  symbol: string
  trueAmount: string
}

export interface FormattedEternalFarming {
  tvl?: number
  bonusReward: string
  bonusRewardRate: string
  bonusRewardToken: TokenSubgraph
  endTime: string
  id: string
  pool: PoolChartSubgraph
  reward: string
  rewardRate: string
  rewardToken: TokenSubgraph
  startTime: string
  tokenAmountForTier1: string
  tokenAmountForTier2: string
  tokenAmountForTier3: string
  tier1Multiplier: string
  tier2Multiplier: string
  tier3Multiplier: string
  multiplierToken: TokenSubgraph
  isDetached: boolean
}

export interface Aprs {
  [type: string]: number
}

export interface Position {
  id: string
  owner: string
  pool: string | PoolSubgraph
  L2tokenId: string
  limitFarming: string | null
  eternalFarming: string | null
  onFarmingCenter: boolean
  enteredInEternalFarming: string
}

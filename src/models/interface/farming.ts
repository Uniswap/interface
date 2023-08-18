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

import { BigNumber } from '@ethersproject/bignumber'

export interface PositionDetails {
  nonce: BigNumber
  tokenId: BigNumber
  operator: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInside0LastX128: BigNumber
  feeGrowthInside1LastX128: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

export interface PoolPositionDetails {
  group?: string
  pool: string
  name: string
  symbol: string
  id: string
  address?: string
  apr?: string
  irr?: string
  poolOwnStake?: BigNumber
  poolDelegatedStake?: BigNumber
  userBalance?: BigNumber
  userHasStake?: boolean
  userIsOwner?: boolean
  currentEpochReward?: BigNumber
}

export enum PositionField {
  TOKEN0 = 'TOKEN0',
  TOKEN1 = 'TOKEN1',
}

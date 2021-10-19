import { BigNumber } from '@ethersproject/bignumber'

import { Token } from '@dynamic-amm/sdk'

export interface Farm {
  fairLaunchAddress: string
  pid: number
  id: string
  rewardTokens: Token[]
  rewardPerBlocks: BigNumber[]
  accRewardPerShares: BigNumber[]
  totalStake: BigNumber
  stakeToken: string
  startBlock: number
  endBlock: number
  lastRewardBlock: number
  token0?: any
  token1?: any
  amp: number
  reserve0: string
  reserve1: string
  reserveUSD: string
  totalSupply: string
  oneDayFeeUSD?: string
  oneDayFeeUntracked?: string
  userData?: {
    allowance?: string
    tokenBalance?: string
    stakedBalance?: string
    rewards?: string[]
  }
  time: string
}

export interface Reward {
  token: Token
  amount: BigNumber
}

export interface RewardPerBlock {
  token: Token
  amount: BigNumber
}

export interface FarmHistoriesSubgraphResult {
  deposits: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    amount: string
  }[]
  withdraws: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    amount: string
  }[]
  harvests: {
    id: string
    timestamp: string
    poolID: number
    stakeToken: string
    rewardToken: string
    amount: string
  }[]
  vests: {
    id: string
    timestamp: string
    rewardToken: string
    amount: string
  }[]
}

export enum FarmHistoryMethod {
  DEPOSIT,
  WITHDRAW,
  HARVEST,
  CLAIM
}

export interface FarmHistory {
  id: string
  timestamp: string
  method: FarmHistoryMethod
  amount: string
  stakeToken?: string
  rewardToken?: string
}

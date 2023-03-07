import { BigNumber } from '@ethersproject/bignumber'
import { Token } from '@kyberswap/ks-sdk-core'

export enum FairLaunchVersion {
  V1,
  V2,
}

export enum RewardLockerVersion {
  V1,
  V2,
}

interface FarmV1 {
  fairLaunchAddress: string
  version: FairLaunchVersion
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

interface FarmV2 {
  fairLaunchAddress: string
  version: FairLaunchVersion
  pid: number
  id: string
  rewardTokens: Token[]
  rewardPerSeconds: BigNumber[]
  accRewardPerShares: BigNumber[]
  totalStake: BigNumber
  stakeToken: string
  generatedToken: string
  startTime: number
  endTime: number
  lastRewardTime: number
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
  vestingDuration: number
  rewardMultipliers: BigNumber[]
}

export interface Farm extends FarmV1, FarmV2 {}

export interface Reward {
  token: Token
  amount: BigNumber
}

/**
 * Time unit can be block or second
 */
export interface RewardPerTimeUnit {
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
  CLAIM,
}

export interface FarmHistory {
  id: string
  timestamp: string
  method: FarmHistoryMethod
  amount: string
  stakeToken?: string
  rewardToken?: string
}

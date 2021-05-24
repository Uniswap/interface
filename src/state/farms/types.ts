import { BigNumber } from '@ethersproject/bignumber'

export interface Farm {
  pid: number
  id: string
  rewardPerBlock: BigNumber
  accRewardPerShare: BigNumber
  totalStake: BigNumber
  stakeToken: string
  startBlock: number
  endBlock: number
  lastRewardBlock: number
  token0?: any
  token1?: any
  amp: number
  reserveUSD: string
  totalSupply: string
  userData?: {
    allowance?: string
    tokenBalance?: string
    stakedBalance?: string
    earnings?: string
  }
}

export interface FarmUserData {
  pid: number
  allowance?: string
  tokenBalance?: string
  stakedBalance?: string
  earnings?: string
}

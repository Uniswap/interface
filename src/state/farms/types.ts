import { BigNumber } from '@ethersproject/bignumber'

import { Token } from 'libs/sdk/src'

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
  reserveUSD: string
  totalSupply: string
  userData?: {
    allowance?: string
    tokenBalance?: string
    stakedBalance?: string
    rewards?: string[]
  }
}

export interface Reward {
  token: Token
  amount: BigNumber
}

export interface RewardPerBlock {
  token: Token
  amount: BigNumber
}

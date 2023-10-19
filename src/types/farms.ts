import { Token } from '@pollum-io/sdk-core'
import { Version } from '@uniswap/token-lists'

export interface FarmListInfo {
  readonly name: string
  readonly timestamp: string
  readonly active: StakingRaw[]
  readonly closed: StakingRaw[]
  readonly version: Version
  readonly logoURI?: string
}

export interface StakingRaw {
  tokens: string[]
  stakingRewardAddress: string
  ended: boolean
  name: string
  lp: string
  baseToken: string
  rate: number
  pair: string
  rewardToken: string
  sponsored: boolean
  link: string
}

export interface StakingBasic {
  tokens: [Token, Token]
  stakingRewardAddress: string
  ended: boolean
  name: string
  lp: string
  baseToken: Token
  rate: number
  pair: string
  rewardToken: Token
}

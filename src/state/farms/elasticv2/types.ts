import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Pool, Position } from '@kyberswap/ks-sdk-elastic'
import { BigNumber } from 'ethers'

export interface ElasticFarmV2 {
  id: string
  startTime: number
  endTime: number
  pool: Pool
  poolAddress: string
  token0: Token
  token1: Token
  totalRewards: Array<CurrencyAmount<Currency>>
  ranges: Array<{
    id: string
    isRemoved: boolean
    tickUpper: number
    tickLower: number
    weight: number
  }>
  stakedTvl: number
  apr: number
}

export interface UserFarmV2Info {
  nftId: BigNumber
  position: Position
  fId: number
  rangeId: number
  liquidity: BigNumber
  unclaimedRewards: Array<CurrencyAmount<Currency>>
}

export interface SubgraphToken {
  id: string
  name: string
  decimals: string
  symbol: string
}

export interface SubgraphFarmV2 {
  id: string
  startTime: string
  endTime: string
  pool: {
    id: string
    feeTier: string
    tick: string
    sqrtPrice: string
    liquidity: string
    reinvestL: string
    token0: SubgraphToken
    token1: SubgraphToken
  }
  rewards: Array<{
    id: string
    token: SubgraphToken
    amount: string
  }>
  ranges: Array<{
    index: number
    isRemoved: boolean
    tickLower: string
    tickUpper: string
    weight: number
  }>
}

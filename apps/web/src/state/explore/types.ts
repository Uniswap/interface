import { Amount, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import {
  Chain,
  OriginToken,
  FeeData as RingFeeData,
  Token,
  V2Pair,
  V3Pool,
  V4Pool,
} from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { FeeData, TokenProject } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

type PricePoint = { timestamp: number; value: number }

export interface TokenStat
  extends Omit<TokenStats, 'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'> {
  volume?: Amount
  priceHistory?: PricePoint[]
  feeData?: FeeData
  originToken?: OriginToken
}

export interface RingTokenStat
  extends Omit<Token, 'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'> {
  volume: number
  priceHistory?: PricePoint[]
  feeData?: RingFeeData
  price?: string
  tvl: number
  originToken: OriginToken
  volume1Day: number
  pricePercentChange1Hour: number
  pricePercentChange1Day: number
  logo?: string
  project?: TokenProject
  hourData?: import('uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks').TokenHourDataPage
  dayData?: import('uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks').TokenDayDataPage
}

type PoolStatWithoutMethods = Omit<
  PoolStats,
  'clone' | 'toBinary' | 'toJson' | 'equals' | 'fromBinary' | 'fromJson' | 'fromJsonString' | 'toJsonString' | 'getType'
>

export interface PoolStat extends PoolStatWithoutMethods {
  apr: Percent
  boostedApr?: number
  volOverTvl?: number
  hookAddress?: string
}

type RingPoolStatWithoutMethods = Omit<
  V2Pair | V3Pool | V4Pool,
  'clone' | 'toBinary' | 'toJson' | 'equals' | 'fromBinary' | 'fromJson' | 'fromJsonString' | 'toJsonString' | 'getType'
>

export interface RingPoolStat extends RingPoolStatWithoutMethods {
  apr: Percent
  volOverTvl?: number
  hookAddress?: string
  token0: Token
  token1: Token
  tvl: number
  volume1Day: number
  volume30Day: number
  feeTier?: number
  totalLiquidity?: number
  totalValueLockedUSD: string
  chain: Chain
  poolId?: string
  address?: string
}

import { Amount, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { FeeData as CreatePositionFeeData } from 'components/Liquidity/Create/types'

type PricePoint = { timestamp: number; value: number }

export interface TokenStat
  extends Omit<TokenStats, 'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'> {
  volume?: Amount
  priceHistory?: PricePoint[]
  feeData?: GraphQLApi.FeeData
}

type PoolStatWithoutMethods = Omit<
  PoolStats,
  | 'clone'
  | 'toBinary'
  | 'toJson'
  | 'equals'
  | 'fromBinary'
  | 'fromJson'
  | 'fromJsonString'
  | 'toJsonString'
  | 'getType'
  | 'feeTier'
>

export interface PoolStat extends PoolStatWithoutMethods {
  apr: Percent
  boostedApr?: number
  volOverTvl?: number
  hookAddress?: string
  feeTier?: CreatePositionFeeData
}

import type { PlainMessage } from '@bufbuild/protobuf'
import { Amount, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import type { FeeData as CreatePositionFeeData } from '~/types/liquidity'

type PricePoint = { timestamp: number; value: number }

export type LegacyExploreStatChainToken = {
  chainId: number
  address: string
  decimals?: number
  isBridged?: boolean
  volume1d?: number
}

/** Data-only shape for token stats (display/API). Plain type so plain objects satisfy it without cast. */
export type TokenStat = Omit<
  PlainMessage<TokenStats>,
  'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'
> & {
  volume?: Amount
  priceHistory?: PricePoint[]
  feeData?: GraphQLApi.FeeData
  /** Stable key for sparkline/cache/row: multichainId when from multichain, normalized address when single-chain. */
  id?: string
  chainTokens?: LegacyExploreStatChainToken[]
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

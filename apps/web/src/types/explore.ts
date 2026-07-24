import type { PlainMessage } from '@bufbuild/protobuf'
import { Amount, ChainToken, PoolStats, TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { Percent } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import type { FeeData as CreatePositionFeeData } from 'uniswap/src/features/positions/types'

/** Explore URL tab segments — shared routing / URL surface (not feature-local). */
export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
  Toucan = 'auctions',
}

type PricePoint = { timestamp: number; value: number }

export type LegacyExploreStatChainToken = Pick<
  PlainMessage<ChainToken>,
  'chainId' | 'address' | 'decimals' | 'isBridged'
> &
  Partial<Pick<PlainMessage<ChainToken>, 'volume1h' | 'volume1d' | 'volume7d' | 'volume30d' | 'volume1y'>>

/** Explore Stats period volumes (omitted from `TokenStat` in favor of filtered `volume`). */
export type ExploreStatVolumeAmounts = Partial<
  Pick<PlainMessage<TokenStats>, 'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year'>
>

/** Data-only shape for token stats (display/API). Plain type so plain objects satisfy it without cast. */
export type TokenStat = Omit<
  PlainMessage<TokenStats>,
  'volume1Hour' | 'volume1Day' | 'volume1Week' | 'volume1Month' | 'volume1Year' | 'chainTokens'
> & {
  volume?: Amount
  priceHistory?: PricePoint[]
  feeData?: GraphQLApi.FeeData
  /** Stable key for sparkline/cache/row: multichainId when from multichain, normalized address when single-chain. */
  id?: string
  chainTokens?: LegacyExploreStatChainToken[]
}

/** TokenStat plus explore period volumes still present after `convertTokenStatsToTokenStat` spread. */
export type TokenStatWithExploreVolumes = TokenStat & ExploreStatVolumeAmounts

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

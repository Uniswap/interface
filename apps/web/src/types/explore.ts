import type { FeeData as CreatePositionFeeData, PositionRewardApr } from 'uniswap/src/features/positions/types'

/** Explore URL tab segments — shared routing / URL surface (not feature-local). */
export enum ExploreTab {
  Tokens = 'tokens',
  Pools = 'pools',
  Transactions = 'transactions',
  Toucan = 'auctions',
}

type PricePoint = { timestamp: number; value: number }

// The shapes below were once derived from the v1 ExploreStats protobuf messages. That client is
// gone, so they are kept as plain data types with the same field names, which is all the Explore
// tables and `gqlToCurrency` ever read from them.

export type Amount = {
  currency?: string
  value: number
}

type PriceHistory = {
  start: number
  end: number
  step: number
  values: number[]
}

type TokenStatProject = {
  logo?: { url?: string }
  name?: string
  url?: string
  isSpam?: boolean
  safetyLevel?: string
}

export type LegacyExploreStatChainToken = {
  chainId: number
  address: string
  decimals?: number
  isBridged?: boolean
  volume1h?: number
  volume1d?: number
  volume7d?: number
  volume30d?: number
  volume1y?: number
}

/** Data-only shape for token stats (display/API). Plain type so plain objects satisfy it without cast. */
export type TokenStat = {
  chain: string
  address: string
  name?: string
  symbol?: string
  logo?: string
  price?: Amount
  fullyDilutedValuation?: Amount
  pricePercentChange1Hour?: Amount
  pricePercentChange1Day?: Amount
  pricePercentChange1Week?: Amount
  pricePercentChange1Month?: Amount
  pricePercentChange1Year?: Amount
  decimals?: number
  project?: TokenStatProject
  standard?: string
  priceHistoryHour?: PriceHistory
  priceHistoryDay?: PriceHistory
  priceHistoryWeek?: PriceHistory
  priceHistoryMonth?: PriceHistory
  priceHistoryYear?: PriceHistory
  volume?: Amount
  priceHistory?: PricePoint[]
  /** Stable key for sparkline/cache/row: multichainId when from multichain, normalized address when single-chain. */
  id?: string
  chainTokens?: LegacyExploreStatChainToken[]
}

type PoolStatBase = {
  id: string
  chain: string
  totalLiquidity?: Amount
  txCount?: number
  volume1Day?: Amount
  volume1Week?: Amount
  volume30Day?: Amount
  token0?: TokenStat
  token1?: TokenStat
  protocolVersion?: string
  hook?: { address: string }
  boostedApr?: number
}

export interface PoolStat extends PoolStatBase {
  /** Backend-served fee APR in percent units (4.99 = 4.99%), from `PoolRankStats.apr`. */
  apr?: number
  /** Backend-summed fee + reward APR, from `PoolRankStats.totalApr`. Never recomposed here. */
  totalApr?: number
  boostedApr?: number
  /**
   * The tokens `boostedApr` is paid in, one entry per token, from `PoolRankStats.token_boosts`.
   * Empty when the pool runs no live campaign — every reward badge renders nothing on an empty list.
   */
  rewards?: PositionRewardApr[]
  volOverTvl?: number
  hookAddress?: string
  feeTier?: CreatePositionFeeData
  /** Backend-served per-pool protocol fee (integer pips); shared with the fee-display column. */
  protocolFeePips?: number
}

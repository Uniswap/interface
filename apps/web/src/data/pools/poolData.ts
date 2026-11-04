import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { PoolTokenRewards } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import type { FeeData } from 'uniswap/src/features/positions/types'

export interface RewardsCampaign {
  id?: string
  boostedApr: number
  startTimestamp?: number
  endTimestamp?: number
  totalRewardAllocation?: string
  distributedRewards?: string
  /**
   * The token the amounts above are denominated in, served alongside the campaign by the liquidity
   * service. Unset when the served reward token can't be built, in which case the amounts above are
   * dropped too — there is no stand-in denomination to scale them at.
   */
  token?: Currency
}

export interface PoolData {
  // basic pool info
  idOrAddress: string
  feeTier?: FeeData
  txCount?: number
  protocolVersion?: ProtocolVersion
  hookAddress?: string

  // token info
  token0: ParsedToken
  tvlToken0?: number
  token0Price?: number

  token1: ParsedToken
  tvlToken1?: number
  token1Price?: number

  // volume
  volumeUSD24H?: number
  volumeUSD24HChange?: number

  // liquidity
  tvlUSD?: number
  tvlUSDChange?: number

  // lp incentive rewards
  rewardsCampaign?: RewardsCampaign

  rewardTokens?: PoolTokenRewards[]

  /** Backend-served fee APR (percent units) from `PoolSummary.apr`. */
  apr?: number

  /** Backend-summed total APR (fee + reward) from `PoolSummary.total_apr`. */
  totalApr?: number

  /**
   * Protocol fee in integer pips, from `PoolSummary.protocol_fee`: additive on top of the LP fee
   * for v4, a carve-out of the fee tier for v2/v3. Unset when the backend has no value — the FE
   * never computes it, so an absent value renders as "unavailable" rather than 0.
   */
  protocolFeePips?: number

  /** Pool category ids in display precedence order, from `PoolSummary.category_ids`; empty when uncategorized. */
  categoryIds?: string[]
}

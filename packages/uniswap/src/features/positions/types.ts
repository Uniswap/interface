import { PlainMessage } from '@bufbuild/protobuf'
import { PositionStatus, ProtocolVersion, RewardBalance } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Position as LiquidityServicePositionMessage } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { EVMUniverseChainId } from '@universe/chains'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'

export type FeeData = {
  isDynamic: boolean
  feeAmount: number
  tickSpacing: number
}

export type DynamicFeeData = FeeData & {
  feeAmount: typeof DYNAMIC_FEE_AMOUNT
}

export const DYNAMIC_FEE_DATA = {
  isDynamic: true,
  feeAmount: DYNAMIC_FEE_AMOUNT,
  tickSpacing: DEFAULT_TICK_SPACING,
} as const satisfies DynamicFeeData

export interface PriceOrdering {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
}

/**
 * One LP-incentive reward token's APR boost on the pool a position sits in, from the liquidity
 * service's `Position.rewards`. The leading `chainId`/`address` pair makes `token` assignable to
 * the reward-token refs the LP-incentive logo clusters take.
 *
 * The reward token lives on its own distribution chain, which can differ from the position's.
 */
export interface PositionRewardApr {
  token: {
    chainId: number
    address: string
    symbol?: string
    decimals?: number
    isNative: boolean
  }
  /**
   * The POOL's boost from campaigns paying this token — already the sum of that token's live
   * campaign APRs, so it must never be added to a per-campaign `boostedApr`. Shared by every
   * position in the pool rather than specific to this one.
   */
  boostedPoolApr: number
}

interface BasePositionInfo {
  status: PositionStatus
  version: ProtocolVersion
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  chainId: EVMUniverseChainId
  poolId: string
  tokenId?: string
  tickLower?: number
  tickUpper?: number
  tickSpacing?: number
  liquidity?: string
  liquidityToken?: Token
  totalSupply?: CurrencyAmount<Currency>
  liquidityAmount?: CurrencyAmount<Currency>
  token0UncollectedFees?: string
  token1UncollectedFees?: string
  fee0Amount?: CurrencyAmount<Currency>
  fee1Amount?: CurrencyAmount<Currency>
  uncollectedFeesUsd?: number
  /** USD value of token0's uncollected fees, priced with the same backend token price as `uncollectedFeesUsd` (fee amount × `token0PriceUsd`). Set on the liquidity-service path; unset on data-api / when token identity is unavailable. Lets the PDP breakdown match the positions-list total instead of re-pricing with a live oracle (LP-1616). */
  token0UncollectedFeesUsd?: number
  /** USD value of token1's uncollected fees. See token0UncollectedFeesUsd. */
  token1UncollectedFeesUsd?: number
  totalValueUsd?: number
  apr?: number
  isHidden?: boolean
  /** Per-pool protocol fee served by data-api (`PoolPosition.protocolFee`), integer pips. Unset = unavailable. */
  protocolFee?: number
  /** Fee APR averaged over the trailing 1 day (`PoolPosition.apr1d`, excludes reward boosts). Unset = day-data unavailable (never set for v2 pairs). */
  apr1d?: number
  /** Fee APR averaged over the trailing 7 days (`PoolPosition.apr7d`). See apr1d. */
  apr7d?: number
  /** Fee APR averaged over the trailing 30 days (`PoolPosition.apr30d`). See apr1d. */
  apr30d?: number
  /** Backend-summed total APR (fee + reward boost), from `Position.total_apr` (liquidity service) or `PoolPosition.totalApr` (data-api). Unset when unavailable. */
  totalApr?: number
  /** Unix seconds of the position's first indexed creation event (`Position.created_at` from the liquidity service). Multiply by ONE_SECOND_MS for a JS ms timestamp. */
  createdAt?: number
  /** Live LP-incentive APR boosts on this position's pool, one entry per reward token. Unset when the pool runs no live campaign (always unset for v2 pairs, which have none). */
  rewards?: PositionRewardApr[]
}

export type V2PairInfo = BasePositionInfo & {
  version: ProtocolVersion.V2
  poolOrPair?: Pair
  liquidityToken: Token
  feeTier: undefined
  v4hook: undefined
  owner: undefined
}

export type V3PositionInfo = BasePositionInfo & {
  version: ProtocolVersion.V3
  tokenId: string
  poolOrPair?: V3Pool
  feeTier?: FeeData
  position?: V3Position
  v4hook: undefined
  owner: string
}

export type V4PositionInfo = BasePositionInfo & {
  version: ProtocolVersion.V4
  tokenId: string
  poolOrPair?: V4Pool
  position?: V4Position
  feeTier?: FeeData
  v4hook?: string
  owner: string
  boostedApr?: number
  // Multi-token LP-incentive reward balances from the data-api PoolPosition.
  rewardBalances?: PlainMessage<RewardBalance>[]
  /** Held via the PermissionedPositionManager; tokenIds are only unique per manager, so reads must carry this selector. */
  isPermissioned?: boolean
}

export type PositionInfo = V2PairInfo | V3PositionInfo | V4PositionInfo

// Plain shape: wallet positions arrive as toPlainMessage output (persisted query); a raw Message still satisfies it.
export type LiquidityServicePosition = PlainMessage<LiquidityServicePositionMessage>

import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

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
  totalValueUsd?: number
  apr?: number
  isHidden?: boolean
  /** Per-pool protocol fee served by data-api (`PoolPosition.protocolFee`), integer pips. Unset = unavailable. */
  protocolFee?: number
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
  totalApr?: number
  unclaimedRewardsAmountUni?: string
  boostedApr?: number
}

export type PositionInfo = V2PairInfo | V3PositionInfo | V4PositionInfo

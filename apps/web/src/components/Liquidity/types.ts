import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { FeeData } from 'components/Liquidity/Create/types'
import { ReactNode } from 'react'
import { PositionField } from 'types/position'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'

export interface PriceOrdering {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
}

export interface DepositState {
  exactField: PositionField
  exactAmounts: {
    [field in PositionField]?: string
  }
}

export interface DepositInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyAmountsUSDValue?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  error?: ReactNode
}

interface BasePositionInfo {
  status: PositionStatus
  version: ProtocolVersion
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  chainId: EVMUniverseChainId
  poolId: string // Refers to pool contract address for v2 & v3, and poolId for v4
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
  apr?: number
  isHidden?: boolean
}

type V2PairInfo = BasePositionInfo & {
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

type V4PositionInfo = BasePositionInfo & {
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

export type FeeTierData = {
  id?: string
  fee: FeeData
  formattedFee: string
  totalLiquidityUsd: number
  percentage: Percent
  tvl: string
  created: boolean
  boostedApr?: number
}

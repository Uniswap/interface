// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { Dispatch, ReactNode, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export interface DepositState {
  exactField: PositionField
  exactAmount?: string
}

export type DepositContextType = {
  depositState: DepositState
  setDepositState: Dispatch<SetStateAction<DepositState>>
  derivedDepositInfo: DepositInfo
}

export interface DepositInfo {
  formattedAmounts?: { [field in PositionField]?: string }
  currencyBalances?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmounts?: { [field in PositionField]?: CurrencyAmount<Currency> }
  currencyAmountsUSDValue?: { [field in PositionField]?: CurrencyAmount<Currency> }
  error?: ReactNode
}

interface BasePositionInfo {
  status: PositionStatus
  version: ProtocolVersion
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  tokenId?: string
  tickLower?: string
  tickUpper?: string
  tickSpacing?: number
  liquidity?: string
  liquidityToken?: Token
  totalSupply?: CurrencyAmount<Currency>
  liquidityAmount?: CurrencyAmount<Currency>
  token0UncollectedFees?: string
  token1UncollectedFees?: string
}

type V2PairInfo = BasePositionInfo & {
  version: ProtocolVersion.V2
  pair?: Pair
  liquidityToken: Token
  feeTier: undefined
  v4hook: undefined
}

export type V3PositionInfo = BasePositionInfo & {
  version: ProtocolVersion.V3
  tokenId: string
  pool?: V3Pool
  feeTier?: FeeAmount
  position?: V3Position
  v4hook: undefined
}

type V4PositionInfo = BasePositionInfo & {
  version: ProtocolVersion.V4
  tokenId: string
  pool?: V4Pool
  position?: V4Position
  feeTier?: string
  v4hook?: string
}

export type PositionInfo = V2PairInfo | V3PositionInfo | V4PositionInfo

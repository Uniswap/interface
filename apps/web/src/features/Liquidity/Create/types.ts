import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import type { FeeData } from 'uniswap/src/features/positions/types'
import { PositionField } from '~/types/position'

export enum PositionFlowStep {
  SELECT_TOKENS_AND_FEE_TIER = 0,
  PRICE_RANGE = 1,
  DEPOSIT = 2,
}

export enum RangeAmountInputPriceMode {
  PRICE = 'price',
  PERCENTAGE = 'percentage',
}

export interface MigratingPosition {
  tickLower: number
  tickUpper: number
  isOutOfRange: boolean
  fee: FeeData
}

export interface PositionState {
  protocolVersion: ProtocolVersion
  fee?: FeeData
  hook?: string
  userApprovedHook?: string // address of approved hook. If different from `hook`, user needs to reapprove the new hook
  // The source position being migrated from (e.g. V3 → V4). Only set during migration flows.
  migratingPosition?: MigratingPosition
}

export const DEFAULT_FEE_DATA = {
  feeAmount: FeeAmount.MEDIUM,
  tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM],
  isDynamic: false,
}

export const DEFAULT_POSITION_STATE: PositionState = {
  fee: undefined,
  hook: undefined,
  userApprovedHook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

type BaseCreatePositionInfo = {
  protocolVersion: ProtocolVersion
  creatingPoolOrPair?: boolean
  poolId?: string
  poolOrPairLoading?: boolean
  refetchPoolData: () => void
}

export type CreateV4PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V4
  currencies: {
    // sorted and both of these are equal for v4
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Currency> }
  }
  pool?: V4Pool
}

export type CreateV3PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V3
  currencies: {
    // sorted
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Token> } // wrapped
  }
  pool?: V3Pool
}

export type CreateV2PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V2
  currencies: {
    // sorted
    display: { [key in PositionField]: Maybe<Currency> }
    sdk: { [key in PositionField]: Maybe<Token> } // wrapped
  }
  pair?: Pair
}

export type CreatePositionInfo = CreateV4PositionInfo | CreateV3PositionInfo | CreateV2PositionInfo

export interface DynamicFeeTierSpeedbumpData {
  open: boolean
  wishFeeData?: FeeData
}

export type PriceDifference = {
  value: number
  absoluteValue: number
  warning?: WarningSeverity
}

export interface PriceRangeState {
  priceInverted: boolean
  fullRange: boolean
  initialPrice: string
  isInitialPriceDirty?: boolean
  // When these are undefined, LiquidityChartRangeInput will calculate and set reasonable default values.
  minTick?: number
  maxTick?: number
  inputMode?: RangeAmountInputPriceMode
}

type BasePriceRangeInfo = {
  protocolVersion: ProtocolVersion
  price?: Price<Currency, Currency>
}

type BasePoolPriceRangeInfo = {
  ticks: [Maybe<number>, Maybe<number>]
}

export type V4PriceRangeInfo = BasePriceRangeInfo &
  BasePoolPriceRangeInfo & {
    protocolVersion: ProtocolVersion.V4
    mockPool?: V4Pool
  }

export type V3PriceRangeInfo = BasePriceRangeInfo &
  BasePoolPriceRangeInfo & {
    protocolVersion: ProtocolVersion.V3
    mockPool?: V3Pool
  }

export type V2PriceRangeInfo = BasePriceRangeInfo & {
  protocolVersion: ProtocolVersion.V2
  mockPair?: Pair
}

export type PriceRangeInfo = V4PriceRangeInfo | V3PriceRangeInfo | V2PriceRangeInfo

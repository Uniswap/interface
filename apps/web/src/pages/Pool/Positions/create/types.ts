// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, TICK_SPACINGS, Pool as V3Pool } from '@uniswap/v3-sdk'
import { Pool as V4Pool } from '@uniswap/v4-sdk'
import { Dispatch, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export type FeeData = {
  feeAmount: number
  tickSpacing: number
}

const DYNAMIC_FEE_AMOUNT = 8388608

export type DynamicFeeData = FeeData & {
  feeAmount: typeof DYNAMIC_FEE_AMOUNT
}

export const DYNAMIC_FEE_DATA = {
  feeAmount: DYNAMIC_FEE_AMOUNT,
  tickSpacing: 60,
} as const satisfies DynamicFeeData

export enum PositionFlowStep {
  SELECT_TOKENS_AND_FEE_TIER,
  PRICE_RANGE,
  DEPOSIT,
}

export interface PositionState {
  protocolVersion: ProtocolVersion
  currencyInputs: { [field in PositionField]?: Currency }
  fee: FeeData
  hook?: string
}

export const DEFAULT_POSITION_STATE: PositionState = {
  currencyInputs: {},
  fee: { feeAmount: FeeAmount.MEDIUM, tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM] },
  hook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

export type OptionalCurrency = Currency | undefined
type BaseCreatePositionInfo = {
  protocolVersion: ProtocolVersion
  currencies: [OptionalCurrency, OptionalCurrency]
  creatingPoolOrPair?: boolean
  poolId?: string
  poolOrPairLoading?: boolean
  isPoolOutOfSync: boolean
}

export type CreateV4PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V4
  pool?: V4Pool
}

export type CreateV3PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V3
  pool?: V3Pool
}

export type CreateV2PositionInfo = BaseCreatePositionInfo & {
  protocolVersion: ProtocolVersion.V2
  pair?: Pair
}

export type CreatePositionInfo = CreateV4PositionInfo | CreateV3PositionInfo | CreateV2PositionInfo

export interface DynamicFeeTierSpeedbumpData {
  open: boolean
  wishFeeData: FeeData
}

export type CreatePositionContextType = {
  reset: () => void
  step: PositionFlowStep
  setStep: Dispatch<SetStateAction<PositionFlowStep>>
  positionState: PositionState
  setPositionState: Dispatch<SetStateAction<PositionState>>
  derivedPositionInfo: CreatePositionInfo
  feeTierSearchModalOpen: boolean
  setFeeTierSearchModalOpen: Dispatch<SetStateAction<boolean>>
  dynamicFeeTierSpeedbumpData: DynamicFeeTierSpeedbumpData
  setDynamicFeeTierSpeedbumpData: Dispatch<SetStateAction<DynamicFeeTierSpeedbumpData>>
}

export interface PriceRangeState {
  priceInverted: boolean
  fullRange: boolean
  // When these are undefined, LiquidityChartRangeInput will calculate and set reasonable default values.
  minPrice?: string
  maxPrice?: string
  initialPriceInverted: boolean
  initialPrice: string
}

type BasePriceRangeInfo = {
  protocolVersion: ProtocolVersion
  deposit0Disabled: boolean
  deposit1Disabled: boolean
  price?: Price<Currency, Currency>
}

export type OptionalCurrencyPrice = Price<Currency, Currency> | undefined
export type OptionalNumber = number | undefined
type BasePoolPriceRangeInfo = {
  ticks: [OptionalNumber, OptionalNumber]
  ticksAtLimit: [boolean, boolean]
  tickSpaceLimits: [OptionalNumber, OptionalNumber]
  isSorted: boolean
  invertPrice: boolean
  invalidPrice: boolean
  invalidRange: boolean
  outOfRange: boolean
  prices: [OptionalCurrencyPrice, OptionalCurrencyPrice]
  pricesAtLimit: [OptionalCurrencyPrice, OptionalCurrencyPrice]
  pricesAtTicks: [OptionalCurrencyPrice, OptionalCurrencyPrice]
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
    isTaxed?: boolean
  }

export type V2PriceRangeInfo = BasePriceRangeInfo & {
  protocolVersion: ProtocolVersion.V2
  mockPair?: Pair
}

export type PriceRangeInfo = V4PriceRangeInfo | V3PriceRangeInfo | V2PriceRangeInfo

export type PriceRangeContextType = {
  reset: () => void
  priceRangeState: PriceRangeState
  setPriceRangeState: Dispatch<SetStateAction<PriceRangeState>>
  derivedPriceRangeInfo: PriceRangeInfo
}

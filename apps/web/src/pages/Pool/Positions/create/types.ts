// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { Dispatch, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export enum PositionFlowStep {
  SELECT_TOKENS_AND_FEE_TIER,
  PRICE_RANGE,
  DEPOSIT,
}

export interface PositionState {
  protocolVersion: ProtocolVersion
  currencyInputs: { [field in PositionField]?: Currency }
  fee: number // Denoted in hundredths of bips
  hook?: string
}

export const DEFAULT_POSITION_STATE: PositionState = {
  currencyInputs: {},
  fee: FeeAmount.MEDIUM,
  hook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

export type PositionInfo = {
  protocolVersion: ProtocolVersion
  currencies: { [field in PositionField]?: Currency }
  tokens?: Token[]
  sortedTokens?: Token[]
} & (
  | {
      protocolVersion: ProtocolVersion.V3 | ProtocolVersion.V4
      pool?: Pool
      tokens?: Token[]
      sortedTokens?: Token[]
    }
  | {
      protocolVersion: ProtocolVersion.V2
      pair?: Pair
    }
  | {
      protocolVersion: ProtocolVersion.UNSPECIFIED
    }
)

export type CreatePositionContextType = {
  step: PositionFlowStep
  setStep: Dispatch<SetStateAction<PositionFlowStep>>
  positionState: PositionState
  setPositionState: Dispatch<SetStateAction<PositionState>>
  derivedPositionInfo: PositionInfo
  feeTierSearchModalOpen: boolean
  setFeeTierSearchModalOpen: Dispatch<SetStateAction<boolean>>
}

export interface PriceRangeState {
  priceInverted: boolean
  fullRange: boolean
  minPrice: string
  maxPrice: string
}

export interface PriceRangeInfo {
  ticks?: (number | undefined)[]
  ticksAtLimit: boolean[]
  tickSpaceLimits: (number | undefined)[]
  isSorted: boolean
  price?: Price<Token, Token>
  prices?: (Price<Token, Token> | undefined)[]
  pricesAtLimit?: (Price<Token, Token> | undefined)[]
  pricesAtTicks?: (Price<Token, Token> | undefined)[]
  baseAndQuoteTokens?: Token[]
  invertPrice: boolean
}

export type PriceRangeContextType = {
  priceRangeState: PriceRangeState
  setPriceRangeState: Dispatch<SetStateAction<PriceRangeState>>
  derivedPriceRangeInfo: PriceRangeInfo
}

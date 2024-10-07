// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, Price, Token } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
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
  fee: number
  hook?: string
}

export const DEFAULT_POSITION_STATE: PositionState = {
  currencyInputs: {},
  fee: 3000,
  hook: undefined,
  protocolVersion: ProtocolVersion.V4,
}

export interface PositionInfo {
  pool?: Pool
  tokens?: Token[]
  sortedTokens?: Token[]
}

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
  isSorted: boolean
  price?: Price<Token, Token>
  prices?: (Price<Token, Token> | undefined)[]
  pricesAtLimit?: (Price<Token, Token> | undefined)[]
  pricesAtTicks?: (Price<Token, Token> | undefined)[]
  baseAndQuoteTokens?: Token[]
}

export type PriceRangeContextType = {
  priceRangeState: PriceRangeState
  setPriceRangeState: Dispatch<SetStateAction<PriceRangeState>>
  derivedPriceRangeInfo: PriceRangeInfo
}

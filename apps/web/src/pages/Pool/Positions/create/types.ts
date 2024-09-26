import { Currency } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import { Dispatch, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export enum PositionFlowStep {
  SELECT_TOKENS,
  PRICE_RANGE,
  DEPOSIT,
}

export interface PositionState {
  tokenInputs: { [field in PositionField]?: Currency }
  fee: number
  hook?: string
}

export interface PositionInfo {
  pool?: Pool
}

export type CreatePositionContextType = {
  step: PositionFlowStep
  setStep: Dispatch<SetStateAction<PositionFlowStep>>
  positionState: PositionState
  setPositionState: Dispatch<SetStateAction<PositionState>>
  derivedPositionInfo: PositionInfo
}

export interface PriceRangeState {
  priceInverted: boolean
  fullRange: boolean
  minPrice: string
  maxPrice: string
}

export type PriceRangeContextType = {
  priceRangeState: PriceRangeState
  setPriceRangeState: Dispatch<SetStateAction<PriceRangeState>>
}

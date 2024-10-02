// eslint-disable-next-line no-restricted-imports
import { Pool, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { Dispatch, SetStateAction } from 'react'
import { PositionField } from 'types/position'

export enum PositionFlowStep {
  SELECT_TOKENS_AND_FEE_TIER,
  PRICE_RANGE,
  DEPOSIT,
}

export interface PositionState {
  protocolVersion: ProtocolVersion
  tokenInputs: { [field in PositionField]?: Currency }
  fee: number
  hook?: string
}

export const DEFAULT_POSITION_STATE: PositionState = {
  tokenInputs: {},
  fee: 3000,
  hook: undefined,
  protocolVersion: ProtocolVersion.UNSPECIFIED,
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
  feeTierSearchModalOpen: boolean
  setFeeTierSearchModalOpen: Dispatch<SetStateAction<boolean>>
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

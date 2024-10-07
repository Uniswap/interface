/* eslint-disable-next-line no-restricted-imports */
import {
  CreatePositionContextType,
  DEFAULT_POSITION_STATE,
  PositionFlowStep,
  PriceRangeContextType,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import React, { useContext } from 'react'

export const CreatePositionContext = React.createContext<CreatePositionContextType>({
  step: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
  setStep: () => undefined,
  positionState: DEFAULT_POSITION_STATE,
  setPositionState: () => undefined,
  feeTierSearchModalOpen: false,
  setFeeTierSearchModalOpen: () => undefined,
  derivedPositionInfo: {
    pool: undefined,
  },
})

export const useCreatePositionContext = () => {
  return useContext(CreatePositionContext)
}

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '0',
  maxPrice: 'INF',
}

export const PriceRangeContext = React.createContext<PriceRangeContextType>({
  priceRangeState: DEFAULT_PRICE_RANGE_STATE,
  setPriceRangeState: () => undefined,
  derivedPriceRangeInfo: {
    isSorted: false,
    ticksAtLimit: [true, true],
  },
})

export const usePriceRangeContext = () => {
  return useContext(PriceRangeContext)
}

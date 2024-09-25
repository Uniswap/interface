import { useDerivedPositionInfo } from 'pages/Pool/Positions/create/hooks'
import {
  CreatePositionContextType,
  PositionFlowStep,
  PositionState,
  PriceRangeContextType,
  PriceRangeState,
} from 'pages/Pool/Positions/create/types'
import React, { useContext, useState } from 'react'

export const DEFAULT_POSITION_STATE: PositionState = {
  tokenInputs: {},
  fee: 3000,
  hook: undefined,
}

const CreatePositionContext = React.createContext<CreatePositionContextType>({
  step: PositionFlowStep.SELECT_TOKENS,
  setStep: () => undefined,
  positionState: DEFAULT_POSITION_STATE,
  setPositionState: () => undefined,
  derivedPositionInfo: {
    pool: undefined,
  },
})

export const useCreatePositionContext = () => {
  return useContext(CreatePositionContext)
}

export function CreatePositionContextProvider({ children }: { children: React.ReactNode }) {
  const [positionState, setPositionState] = useState<PositionState>(DEFAULT_POSITION_STATE)
  const [step, setStep] = useState<PositionFlowStep>(PositionFlowStep.SELECT_TOKENS)
  const derivedPositionInfo = useDerivedPositionInfo(positionState)

  return (
    <CreatePositionContext.Provider value={{ step, setStep, positionState, setPositionState, derivedPositionInfo }}>
      {children}
    </CreatePositionContext.Provider>
  )
}

export const DEFAULT_PRICE_RANGE_STATE: PriceRangeState = {
  priceInverted: false,
  fullRange: true,
  minPrice: '0',
  maxPrice: 'INF',
}

const PriceRangeContext = React.createContext<PriceRangeContextType>({
  priceRangeState: DEFAULT_PRICE_RANGE_STATE,
  setPriceRangeState: () => undefined,
})

export const usePriceRangeContext = () => {
  return useContext(PriceRangeContext)
}

export function PriceRangeContextProvider({ children }: { children: React.ReactNode }) {
  const [priceRangeState, setPriceRangeState] = useState<PriceRangeState>(DEFAULT_PRICE_RANGE_STATE)

  return (
    <PriceRangeContext.Provider value={{ priceRangeState, setPriceRangeState }}>{children}</PriceRangeContext.Provider>
  )
}

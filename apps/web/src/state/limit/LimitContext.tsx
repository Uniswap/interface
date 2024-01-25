import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useState } from 'react'

import { LimitInfo, useDerivedLimitInfo } from './hooks'

export enum Expiry {
  Day = 1,
  Week,
  Month,
  Year,
}

export interface LimitState {
  readonly inputAmount: string
  readonly outputAmount: string
  readonly expiry: Expiry
  readonly limitPrice: string

  // The limit form has 3 fields, but only two of them can be independent at a time.
  // Always prefer `marketPrice` be independent, so either derive the input amount or the output amount
  readonly isInputAmountFixed: boolean
}

type LimitContextType = {
  limitState: LimitState
  derivedLimitInfo: LimitInfo
  setLimitState: Dispatch<SetStateAction<LimitState>>
}

const DEFAULT_LIMIT_STATE = {
  inputAmount: '',
  limitPrice: '',
  outputAmount: '',
  expiry: Expiry.Day, // TODO: update default expiry?
  isInputAmountFixed: true,
}

// exported for testing
export const LimitContext = createContext<LimitContextType>({
  limitState: DEFAULT_LIMIT_STATE,
  setLimitState: () => undefined,
  derivedLimitInfo: {
    currencyBalances: {},
    parsedAmounts: {},
  },
})

export function useLimitContext() {
  return useContext(LimitContext)
}

export function LimitContextProvider({ children }: PropsWithChildren) {
  const [limitState, setLimitState] = useState<LimitState>(DEFAULT_LIMIT_STATE)

  const derivedLimitInfo = useDerivedLimitInfo(limitState)

  return (
    <LimitContext.Provider value={{ limitState, setLimitState, derivedLimitInfo }}>{children}</LimitContext.Provider>
  )
}

export function useLimitPrice() {
  const { limitState, setLimitState } = useLimitContext()
  const setLimitPrice = (limitPrice: string) => {
    setLimitState((prevState) => ({ ...prevState, limitPrice }))
  }
  return { limitPrice: limitState.limitPrice, setLimitPrice }
}

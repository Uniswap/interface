import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useState } from 'react'

import { LimitInfo, useDerivedLimitInfo } from './hooks'

export enum Expiry {
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}

export interface LimitState {
  readonly inputAmount: string
  readonly outputAmount: string
  readonly expiry: Expiry
  readonly limitPrice: string
  readonly limitPriceInverted: boolean

  // The form should autofill in the market price between two currencies unless the user has
  // already manually edited the price for that currency pair
  readonly limitPriceEdited: boolean

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
  limitPriceEdited: false,
  limitPriceInverted: false,
  outputAmount: '',
  expiry: Expiry.Week,
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

  const derivedLimitInfo = useDerivedLimitInfo(limitState, setLimitState)

  return (
    <LimitContext.Provider value={{ limitState, setLimitState, derivedLimitInfo }}>{children}</LimitContext.Provider>
  )
}

export function useLimitPrice() {
  const { limitState, setLimitState } = useLimitContext()
  const setLimitPrice = (limitPrice: string) => {
    setLimitState((prevState) => ({ ...prevState, limitPrice, limitPriceEdited: true }))
  }
  return { limitPrice: limitState.limitPrice, setLimitPrice, limitPriceInverted: limitState.limitPriceInverted }
}

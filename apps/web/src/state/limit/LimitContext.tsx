import { createContext, PropsWithChildren, useContext, useState } from 'react'

import { useDerivedLimitInfo } from './hooks'
import { Expiry, LimitContextType, LimitState } from './types'

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

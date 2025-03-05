import { createContext, PropsWithChildren, useContext, useState } from 'react'
import { useDerivedLimitInfo } from 'state/limit/hooks'
import { LimitContextType, LimitState } from 'state/limit/types'
import { LimitsExpiry } from 'uniswap/src/types/limits'

const DEFAULT_LIMIT_STATE = {
  inputAmount: '',
  limitPrice: '',
  limitPriceEdited: false,
  limitPriceInverted: false,
  outputAmount: '',
  expiry: LimitsExpiry.Week,
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

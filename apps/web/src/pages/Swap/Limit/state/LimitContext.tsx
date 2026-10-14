import { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { useDerivedLimitInfo } from '~/pages/Swap/Limit/state/hooks'
import { LimitContextType, LimitState } from '~/pages/Swap/Limit/state/types'

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

  // A rejected market-price reference means an auto-filled limit price is a stale anchor (e.g. the
  // previous pair's rate) — clear it so the field reads empty like a fresh load. Legs still loading
  // leave the field alone, and a user-typed price (limitPriceEdited) always stands.
  // This is the clear-half of the autofill lifecycle; the fill-half lives in LimitForm's prefill effect.
  const { marketPriceRejected } = derivedLimitInfo
  const { limitPrice, limitPriceEdited } = limitState
  useEffect(() => {
    if (marketPriceRejected && limitPrice && !limitPriceEdited) {
      setLimitState((prev) => ({ ...prev, limitPrice: '' }))
    }
  }, [marketPriceRejected, limitPrice, limitPriceEdited])

  return (
    <LimitContext.Provider value={{ limitState, setLimitState, derivedLimitInfo }}>{children}</LimitContext.Provider>
  )
}

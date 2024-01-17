import { createContext, Dispatch, PropsWithChildren, SetStateAction, useContext, useState } from 'react'

import { LimitInfo, useDerivedLimitInfo } from './hooks'

enum Expiry {
  Day = 1,
  Week,
  Month,
  Year,
}

export interface LimitState {
  readonly inputAmount: string
  readonly price: string
  readonly outputAmount: string
  readonly expiry: Expiry
}

type LimitContextType = {
  limitState: LimitState
  derivedLimitInfo: LimitInfo
  setLimitState: Dispatch<SetStateAction<LimitState>>
}

const DEFAULT_LIMIT_STATE = {
  inputAmount: '',
  price: '',
  outputAmount: '',
  expiry: Expiry.Day, // TODO: update default expiry?
}

const LimitContext = createContext<LimitContextType>({
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

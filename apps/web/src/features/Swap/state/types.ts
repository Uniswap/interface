import type { Currency } from '@uniswap/sdk-core'
import { createContext, Dispatch, SetStateAction } from 'react'
import { SwapTab } from 'uniswap/src/types/screens/interface'

/** Shared input/output pair for swap and limit surfaces. */
export interface CurrencyState {
  inputCurrency?: Currency
  outputCurrency?: Currency
}

type SwapAndLimitContextType = {
  currencyState: CurrencyState
  setCurrencyState: Dispatch<SetStateAction<CurrencyState>>
  currentTab: SwapTab
  setCurrentTab: Dispatch<SetStateAction<SwapTab>>
}

export const SwapAndLimitContext = createContext<SwapAndLimitContextType>({
  currencyState: {
    inputCurrency: undefined,
    outputCurrency: undefined,
  },
  setCurrencyState: () => undefined,
  currentTab: SwapTab.Swap,
  setCurrentTab: () => undefined,
})

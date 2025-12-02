import { Currency } from '@uniswap/sdk-core'
import { createContext, Dispatch, SetStateAction } from 'react'
import { RouterPreference } from 'state/routing/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'

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

export interface SerializedCurrencyState {
  inputCurrencyAddress?: string
  outputCurrencyAddress?: string
  value?: string
  field?: string
  chainId?: number
  outputChainId?: number
}

// shared state between Swap and Limit
export interface CurrencyState {
  inputCurrency?: Currency
  outputCurrency?: Currency
}

export interface SwapState {
  readonly independentField: CurrencyField
  readonly typedValue: string
  routerPreferenceOverride?: RouterPreference.API
}

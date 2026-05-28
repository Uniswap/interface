import { createContext, Dispatch, SetStateAction } from 'react'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import type { CurrencyState } from '~/features/Swap/state/swap/tradeCurrencyStateTypes'

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

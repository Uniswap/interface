import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Dispatch, ReactNode, SetStateAction, createContext } from 'react'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { CurrencyField } from 'uniswap/src/types/currency'
import { SwapTab } from 'uniswap/src/types/screens/interface'

export type SwapInfo = {
  currencies: { [field in CurrencyField]?: Currency }
  currencyBalances: { [field in CurrencyField]?: CurrencyAmount<Currency> }
  inputTax: Percent
  outputTax: Percent
  outputFeeFiatValue?: number
  parsedAmount?: CurrencyAmount<Currency>
  inputError?: ReactNode
  trade: {
    trade?: InterfaceTrade
    state: TradeState
    uniswapXGasUseEstimateUSD?: number
    error?: any
    swapQuoteLatency?: number
  }
  allowedSlippage: Percent
  autoSlippage: Percent
}

type SwapContextType = {
  swapState: SwapState
  derivedSwapInfo: SwapInfo
  setSwapState: Dispatch<SetStateAction<SwapState>>
}

const EMPTY_DERIVED_SWAP_INFO: SwapInfo = Object.freeze({
  currencies: {},
  currencyBalances: {},
  inputTax: new Percent(0),
  outputTax: new Percent(0),
  autoSlippage: new Percent(0),
  allowedSlippage: new Percent(0),
  trade: {
    state: TradeState.LOADING,
  },
})

export const initialSwapState: SwapState = {
  typedValue: '',
  independentField: CurrencyField.INPUT,
}

export const SwapContext = createContext<SwapContextType>({
  swapState: initialSwapState,
  derivedSwapInfo: EMPTY_DERIVED_SWAP_INFO,
  setSwapState: () => undefined,
})

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
  inputCurrencyId?: string
  outputCurrencyId?: string
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

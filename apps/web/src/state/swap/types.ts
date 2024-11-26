import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Dispatch, ReactNode, SetStateAction, createContext } from 'react'
import { InterfaceTrade, RouterPreference, TradeState } from 'state/routing/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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

export const EMPTY_DERIVED_SWAP_INFO: SwapInfo = Object.freeze({
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
  prefilledState: {
    inputCurrency?: Currency
    outputCurrency?: Currency
  }
  setSelectedChainId: Dispatch<SetStateAction<UniverseChainId | undefined | null>>
  isUserSelectedToken: boolean
  setIsUserSelectedToken: Dispatch<SetStateAction<boolean>>
  setCurrencyState: Dispatch<SetStateAction<CurrencyState>>
  currentTab: SwapTab
  setCurrentTab: Dispatch<SetStateAction<SwapTab>>
  // The chainId of the context - can be different from the connected Chain ID
  // if multichain UX is enabled, otherwise it will be the same as the connected chain ID
  chainId?: UniverseChainId
  // The initial chain ID - used by TDP and PDP pages to keep swap scoped to the initial chain
  initialChainId?: UniverseChainId
  multichainUXEnabled?: boolean
  // Components may use swap and limit context while outside of the context
  // this flag is used to determine if we should fallback to account.chainId
  // instead of using the context chainId
  isSwapAndLimitContext: boolean
}

export const SwapAndLimitContext = createContext<SwapAndLimitContextType>({
  currencyState: {
    inputCurrency: undefined,
    outputCurrency: undefined,
  },
  setCurrencyState: () => undefined,
  setSelectedChainId: () => undefined,
  isUserSelectedToken: false,
  setIsUserSelectedToken: () => undefined,
  prefilledState: {
    inputCurrency: undefined,
    outputCurrency: undefined,
  },
  chainId: UniverseChainId.Mainnet,
  initialChainId: UniverseChainId.Mainnet,
  currentTab: SwapTab.Swap,
  setCurrentTab: () => undefined,
  multichainUXEnabled: false,
  isSwapAndLimitContext: false,
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

import { ChainId, Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { Field, SwapTab } from 'components/swap/constants'
import { parsedQueryString } from 'hooks/useParsedQueryString'
import { ParsedQs } from 'qs'
import { Dispatch, ReactNode, SetStateAction, createContext } from 'react'
import { InterfaceTrade, TradeState } from 'state/routing/types'

export type SwapInfo = {
  currencies: { [field in Field]?: Currency }
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
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

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

export function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)
  const independentField = parseIndependentFieldURLParameter(parsedQs.exactField)

  return {
    typedValue,
    independentField,
  }
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

export const initialSwapState: SwapState = queryParametersToSwapState(parsedQueryString())

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
  setCurrencyState: Dispatch<SetStateAction<CurrencyState>>
  currentTab: SwapTab
  setCurrentTab: Dispatch<SetStateAction<SwapTab>>
  // The chainId of the page/context - can be different from the connected Chain ID if the
  // page is displaying content for a different chain
  chainId?: ChainId
}

export const SwapAndLimitContext = createContext<SwapAndLimitContextType>({
  currencyState: {
    inputCurrency: undefined,
    outputCurrency: undefined,
  },
  setCurrencyState: () => undefined,
  prefilledState: {
    inputCurrency: undefined,
    outputCurrency: undefined,
  },
  chainId: ChainId.MAINNET,
  currentTab: SwapTab.Swap,
  setCurrentTab: () => undefined,
})

export interface SerializedCurrencyState {
  inputCurrencyId?: string
  outputCurrencyId?: string
}

// shared state between Swap and Limit
export interface CurrencyState {
  inputCurrency?: Currency
  outputCurrency?: Currency
}

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
}

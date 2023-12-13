import { ChainId, Percent } from '@uniswap/sdk-core'
import { Field, SwapTab } from 'components/swap/constants'
import { parsedQueryString } from 'hooks/useParsedQueryString'
import { createContext, Dispatch, SetStateAction, useContext, useMemo, useState } from 'react'
import { TradeState } from 'state/routing/types'

import { queryParametersToSwapState, SwapInfo, useDerivedSwapInfo } from './hooks'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  inputCurrencyId?: string | null
  outputCurrencyId?: string | null
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

export const initialSwapState: SwapState = queryParametersToSwapState(parsedQueryString())

type SwapContextType = {
  swapState: SwapState
  prefilledState: {
    inputCurrencyId?: string | null
    outputCurrencyId?: string | null
  }
  derivedSwapInfo: SwapInfo
  setSwapState: Dispatch<SetStateAction<SwapState>>
  currentTab: SwapTab
  setCurrentTab: (tab: SwapTab) => void
  // The chainId of the page/context - can be different from the connected Chain ID if the
  // page is displaying content for a different chain
  chainId?: ChainId
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

export const SwapContext = createContext<SwapContextType>({
  swapState: initialSwapState,
  prefilledState: {
    inputCurrencyId: undefined,
    outputCurrencyId: undefined,
  },
  chainId: ChainId.MAINNET,
  derivedSwapInfo: EMPTY_DERIVED_SWAP_INFO,
  setSwapState: () => undefined,
  currentTab: SwapTab.Swap,
  setCurrentTab: () => undefined,
})

export function useSwapContext() {
  return useContext(SwapContext)
}

export function SwapContextProvider({
  children,
  chainId,
  initialInputCurrencyId,
  initialOutputCurrencyId,
}: {
  children: React.ReactNode
  chainId?: ChainId
  initialInputCurrencyId?: string | null
  initialOutputCurrencyId?: string | null
}) {
  const [currentTab, setCurrentTab] = useState<SwapTab>(SwapTab.Swap)

  const prefilledState = useMemo(
    () => ({
      inputCurrencyId: initialInputCurrencyId,
      outputCurrencyId: initialOutputCurrencyId,
    }),
    [initialInputCurrencyId, initialOutputCurrencyId]
  )

  const [swapState, setSwapState] = useState<SwapState>({ ...initialSwapState, ...prefilledState })
  const derivedSwapInfo = useDerivedSwapInfo(swapState, chainId)

  return (
    <SwapContext.Provider
      value={{ swapState, setSwapState, derivedSwapInfo, chainId, prefilledState, currentTab, setCurrentTab }}
    >
      {children}
    </SwapContext.Provider>
  )
}

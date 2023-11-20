import { ChainId, Percent } from '@uniswap/sdk-core'
import { createContext, useContext, useMemo, useReducer } from 'react'
import { TradeState } from 'state/routing/types'

import { Field } from './actions'
import { SwapInfo, useDerivedSwapInfo } from './hooks'
import swapReducer, { initialState as initialSwapState, SwapState } from './reducer'

type SwapContextType = {
  state: SwapState
  prefilledState: {
    INPUT: {
      currencyId?: string | null
    }
    OUTPUT: {
      currencyId?: string | null
    }
  }
  derivedSwapInfo: SwapInfo
  dispatch: (action: any) => void
  // The chainId of the page/context - can be different from the connected Chain ID if the
  // page is displaying content for a different chain
  chainId?: ChainId
}

export const initialDerivedSwapInfo: SwapInfo = {
  currencies: {},
  currencyBalances: {},
  inputTax: new Percent(0),
  outputTax: new Percent(0),
  autoSlippage: new Percent(0),
  allowedSlippage: new Percent(0),
  trade: {
    state: TradeState.LOADING,
  },
}

export const SwapContext = createContext<SwapContextType>({
  state: initialSwapState,
  prefilledState: {
    INPUT: {
      currencyId: undefined,
    },
    OUTPUT: {
      currencyId: undefined,
    },
  },
  chainId: ChainId.MAINNET,
  derivedSwapInfo: initialDerivedSwapInfo,
  dispatch: () => undefined,
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
  const prefilledState = useMemo(
    () => ({
      [Field.INPUT]: { currencyId: initialInputCurrencyId },
      [Field.OUTPUT]: { currencyId: initialOutputCurrencyId },
    }),
    [initialInputCurrencyId, initialOutputCurrencyId]
  )

  const [state, dispatch] = useReducer(swapReducer, { ...initialSwapState, ...prefilledState })
  const derivedSwapInfo = useDerivedSwapInfo(state, chainId)
  return (
    <SwapContext.Provider value={{ state, dispatch, derivedSwapInfo, chainId, prefilledState }}>
      {children}
    </SwapContext.Provider>
  )
}

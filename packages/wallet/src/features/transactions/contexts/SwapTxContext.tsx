import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { useSwapTxAndGasInfoTradingApi } from 'wallet/src/features/transactions/swap/trade/tradingApi/hooks/useSwapTxAndGasInfoTradingApi'

type SwapTxContextState = {
  txRequest: ReturnType<typeof useSwapTxAndGasInfoTradingApi>['txRequest']
  approveTxRequest: ReturnType<typeof useSwapTxAndGasInfoTradingApi>['approveTxRequest']
  approvalError: ReturnType<typeof useSwapTxAndGasInfoTradingApi>['approvalError']
  gasFee: ReturnType<typeof useSwapTxAndGasInfoTradingApi>['gasFee']
}

export const SwapTxContext = createContext<SwapTxContextState | undefined>(undefined)

// Same as above, with different hook for data fetching.
export function SwapTxContextProviderTradingApi({ children }: { children: ReactNode }): JSX.Element {
  const { derivedSwapInfo } = useSwapFormContext()

  const { txRequest, approveTxRequest, gasFee, approvalError } = useSwapTxAndGasInfoTradingApi({
    derivedSwapInfo,
  })

  const state = useMemo<SwapTxContextState>(
    (): SwapTxContextState => ({
      txRequest,
      approveTxRequest,
      gasFee,
      approvalError,
    }),
    [approvalError, approveTxRequest, gasFee, txRequest],
  )

  return <SwapTxContext.Provider value={state}>{children}</SwapTxContext.Provider>
}

export const useSwapTxContext = (): SwapTxContextState => {
  const swapContext = useContext(SwapTxContext)

  if (swapContext === undefined) {
    throw new Error('`useSwapTxContext` must be used inside of `SwapTxContextProvider`')
  }

  return swapContext
}

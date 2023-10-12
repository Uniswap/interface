import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'

type SwapTxContextState = {
  txRequest: ReturnType<typeof useSwapTxAndGasInfo>['txRequest']
  approveTxRequest: ReturnType<typeof useSwapTxAndGasInfo>['approveTxRequest']
  gasFee: ReturnType<typeof useSwapTxAndGasInfo>['gasFee']
}

export const SwapTxContext = createContext<SwapTxContextState | undefined>(undefined)

export function SwapTxContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const { derivedSwapInfo } = useSwapFormContext()

  const { txRequest, approveTxRequest, gasFee } = useSwapTxAndGasInfo({
    derivedSwapInfo,
    skipGasFeeQuery: false,
  })

  const state = useMemo<SwapTxContextState>(
    (): SwapTxContextState => ({
      txRequest,
      approveTxRequest,
      gasFee,
    }),
    [approveTxRequest, gasFee, txRequest]
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

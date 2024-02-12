import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'

type SwapTxContextState = {
  txRequest: ReturnType<typeof useSwapTxAndGasInfo>['txRequest']
  approveTxRequest: ReturnType<typeof useSwapTxAndGasInfo>['approveTxRequest']
  gasFee: ReturnType<typeof useSwapTxAndGasInfo>['gasFee']
}

export const SwapTxContext = createContext<SwapTxContextState | undefined>(undefined)

export function SwapTxContextProvider({ children }: { children: ReactNode }): JSX.Element {
  const { derivedSwapInfo } = useSwapFormContext()

  const currencyBalanceIn = derivedSwapInfo.currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)

  const balanceLimitedDerivedSwapInfo = useMemo(() => {
    if (swapBalanceInsufficient) {
      return {
        ...derivedSwapInfo,
        currencyAmounts: {
          // When the balance is insufficient to swap, we want to skip the Tx and Gas queries to avoid a 400 error,
          // so we set the amounts to `null` to let the `useSwapTxAndGasInfo` hook (and its dependencies) know that they can skip this logic.
          // The UI will show an "insufficient balance" error when this happens.
          [CurrencyField.INPUT]: null,
          [CurrencyField.OUTPUT]: null,
        },
      }
    }

    return derivedSwapInfo
  }, [derivedSwapInfo, swapBalanceInsufficient])

  const { txRequest, approveTxRequest, gasFee } = useSwapTxAndGasInfo({
    derivedSwapInfo: balanceLimitedDerivedSwapInfo,
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

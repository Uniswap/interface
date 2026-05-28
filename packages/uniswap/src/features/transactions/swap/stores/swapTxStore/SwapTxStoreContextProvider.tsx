import { useEffect, useState } from 'react'
import { useSwapTxAndGasInfo as useServiceBasedSwapTxAndGasInfo } from 'uniswap/src/features/transactions/swap/review/services/swapTxAndGasInfoService/hooks'
import { createSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import { SwapTxStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/SwapTxStoreContext'
import { usePreviousWithLayoutEffect } from 'utilities/src/react/usePreviousWithLayoutEffect'

export function SwapTxStoreContextProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const txState = useServiceBasedSwapTxAndGasInfo()

  const [{ store, cleanup }] = useState(() => createSwapTxStore(txState))

  useEffect(() => () => cleanup(), [cleanup])

  const previousTxState = usePreviousWithLayoutEffect(txState)

  useEffect(() => {
    if (previousTxState !== txState) {
      store.setState(txState)
    }
  }, [txState, previousTxState, store])

  return <SwapTxStoreContext.Provider value={store}>{children}</SwapTxStoreContext.Provider>
}

import { useState } from 'react'
import { createSwapFormWarningStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/createSwapFormWarningStore'
import { SwapFormWarningStoreContext } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/SwapFormWarningStoreContext'

export const SwapFormWarningStoreContextProvider = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  const [store] = useState(() => createSwapFormWarningStore())

  return <SwapFormWarningStoreContext.Provider value={store}>{children}</SwapFormWarningStoreContext.Provider>
}

import type { PropsWithChildren } from 'react'
import { useState } from 'react'
import { createSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/createSwapReviewWarningStore'
import { SwapReviewWarningStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/SwapReviewWarningStoreContext'

export const SwapReviewWarningStoreContextProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [store] = useState(() => createSwapReviewWarningStore())

  return <SwapReviewWarningStoreContext.Provider value={store}>{children}</SwapReviewWarningStoreContext.Provider>
}

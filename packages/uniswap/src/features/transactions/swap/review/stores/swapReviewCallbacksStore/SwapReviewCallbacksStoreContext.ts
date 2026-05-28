import { createContext } from 'react'
import type { createSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/createSwapReviewCallbacksStore'

export const SwapReviewCallbacksStoreContext = createContext<ReturnType<typeof createSwapReviewCallbacksStore> | null>(
  null,
)

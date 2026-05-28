import { createContext } from 'react'
import type { SwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/createSwapReviewWarningStore'

export const SwapReviewWarningStoreContext = createContext<SwapReviewWarningStore | null>(null)

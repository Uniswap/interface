import { createContext } from 'react'
import type { createSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/createSwapReviewStore'

export const SwapReviewStoreContext = createContext<ReturnType<typeof createSwapReviewStore> | null>(null)

import { createContext } from 'react'
import type { SwapFormWarningStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/createSwapFormWarningStore'

export const SwapFormWarningStoreContext = createContext<SwapFormWarningStore | null>(null)

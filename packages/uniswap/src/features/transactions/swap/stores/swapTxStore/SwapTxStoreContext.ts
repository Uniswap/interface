import { createContext } from 'react'
import type { SwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'

export const SwapTxStoreContext = createContext<SwapTxStore | undefined>(undefined)

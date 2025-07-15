import { createContext } from 'react'
import type { SwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/createSwapFormStore'

export const SwapFormStoreContext = createContext<SwapFormStore | null>(null)

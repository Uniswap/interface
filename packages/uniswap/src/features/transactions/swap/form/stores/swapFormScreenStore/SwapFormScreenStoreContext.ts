import { createContext } from 'react'
import type { createSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/createSwapFormScreenStore'

export const SwapFormScreenStoreContext = createContext<ReturnType<typeof createSwapFormScreenStore> | null>(null)

import { createContext } from 'react'
import type { createSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/createSwapDependenciesStore'

export const SwapDependenciesStoreContext = createContext<ReturnType<typeof createSwapDependenciesStore> | null>(null)

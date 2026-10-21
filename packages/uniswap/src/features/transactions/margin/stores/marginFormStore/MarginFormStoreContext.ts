import { createContext } from 'react'
import type { MarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'

export const MarginFormStoreContext = createContext<MarginFormStore | null>(null)

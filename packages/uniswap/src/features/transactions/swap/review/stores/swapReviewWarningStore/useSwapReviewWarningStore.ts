import { useContext } from 'react'
import type {
  SwapReviewWarningState,
  SwapReviewWarningStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/createSwapReviewWarningStore'
import { SwapReviewWarningStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/SwapReviewWarningStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapReviewWarningStoreBase = (): SwapReviewWarningStore => {
  const store = useContext(SwapReviewWarningStoreContext)

  if (!store) {
    throw new Error('SwapReviewWarningStoreContext not found')
  }

  return store
}

// Enforce shallow comparison and event-stable selectors
export const useSwapReviewWarningStore = <U>(selector: (state: SwapReviewWarningState) => U): U => {
  const store = useSwapReviewWarningStoreBase()

  return useStore(store, useShallow(selector))
}

// Hook for consuming just the actions
export const useSwapReviewWarningStateActions = (): SwapReviewWarningState['actions'] => {
  const store = useSwapReviewWarningStoreBase()

  return useStore(store, (state) => state.actions) as SwapReviewWarningState['actions']
}

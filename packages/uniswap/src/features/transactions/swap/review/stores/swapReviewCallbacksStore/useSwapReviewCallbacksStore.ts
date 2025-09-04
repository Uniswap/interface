import { useContext } from 'react'
import type {
  SwapReviewCallbacksStoreState,
  UseSwapReviewCallbacksStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/createSwapReviewCallbacksStore'
import { SwapReviewCallbacksStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/SwapReviewCallbacksStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapReviewCallbacksStoreBase = (): UseSwapReviewCallbacksStore => {
  const store = useContext(SwapReviewCallbacksStoreContext)

  if (!store) {
    throw new Error('useSwapReviewCallbacksStore must be used within a SwapReviewCallbacksStoreContext')
  }

  return store
}

export function useSwapReviewCallbacksStore<T>(selector: (state: SwapReviewCallbacksStoreState) => T): T {
  const store = useSwapReviewCallbacksStoreBase()

  return useStore(store, useShallow(selector))
}

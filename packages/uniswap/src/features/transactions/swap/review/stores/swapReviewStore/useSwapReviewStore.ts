import { useContext } from 'react'
import type {
  SwapReviewState,
  SwapReviewStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/createSwapReviewStore'
import { EMPTY_STEPS } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/createSwapReviewStore'
import { SwapReviewStoreContext } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/SwapReviewContext'
import { isWebApp } from 'utilities/src/platform'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

type ShowInterfaceSelectorReturn = Pick<SwapReviewState, 'currentStep' | 'steps'>

const useSwapReviewStoreBase = (): SwapReviewStore => {
  const store = useContext(SwapReviewStoreContext)

  if (!store) {
    throw new Error('useSwapReviewStore must be used within SwapReviewStoreContextProvider')
  }

  return store
}

export function useSwapReviewStore<T>(selector: (state: Omit<SwapReviewState, 'actions'>) => T): T {
  const store = useSwapReviewStoreBase()

  return useStore(store, useShallow(selector))
}

export const useSwapReviewActions = (): SwapReviewState['actions'] => {
  const store = useSwapReviewStoreBase()

  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}

// Derived selector hook for `showInterfaceReviewSteps`
export const useShowInterfaceReviewSteps = (): boolean => {
  // By conditionally defining the selector, we're able to avoid subscribing to the store when we're not on interface
  const { currentStep, steps } = useSwapReviewStore(
    isWebApp
      ? (s): ShowInterfaceSelectorReturn => ({
          currentStep: s.currentStep,
          steps: s.steps,
        })
      : (): ShowInterfaceSelectorReturn => ({ currentStep: undefined, steps: EMPTY_STEPS }),
  )

  return Boolean(isWebApp && currentStep && steps.length > 1)
}

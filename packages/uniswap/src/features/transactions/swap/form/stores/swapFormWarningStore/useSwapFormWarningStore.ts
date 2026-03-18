import { useContext } from 'react'
import type {
  SwapFormWarningStore,
  SwapFormWarningStoreState,
} from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/createSwapFormWarningStore'
import { SwapFormWarningStoreContext } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/SwapFormWarningStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapFormWarningStoreBase = (): SwapFormWarningStore => {
  const store = useContext(SwapFormWarningStoreContext)

  if (!store) {
    throw new Error('SwapFormWarningStoreContext not found')
  }

  return store
}

export const useSwapFormWarningStore = <U>(selector: (state: Omit<SwapFormWarningStoreState, 'actions'>) => U): U => {
  const store = useSwapFormWarningStoreBase()

  return useStore(store, useShallow(selector))
}

export const useSwapFormWarningStoreActions = (): SwapFormWarningStoreState['actions'] => {
  const store = useSwapFormWarningStoreBase()

  return useStore(store, (s) => s.actions)
}

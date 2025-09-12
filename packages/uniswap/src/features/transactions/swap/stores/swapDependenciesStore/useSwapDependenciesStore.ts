import { useContext } from 'react'
import type {
  createSwapDependenciesStore,
  SwapDependenciesState,
} from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/createSwapDependenciesStore'
import { SwapDependenciesStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/SwapDependenciesStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

export const useSwapDependenciesStoreBase = (): ReturnType<typeof createSwapDependenciesStore> => {
  const store = useContext(SwapDependenciesStoreContext)

  if (!store) {
    throw new Error('useSwapDependenciesStore must be used within SwapDependenciesStoreContextProvider')
  }

  return store
}

export function useSwapDependenciesStore<T>(selector: (state: Omit<SwapDependenciesState, 'actions'>) => T): T {
  const store = useSwapDependenciesStoreBase()

  return useStore(store, useShallow(selector))
}

export const useSwapDependenciesStoreActions = (): SwapDependenciesState['actions'] => {
  const store = useSwapDependenciesStoreBase()

  return useStore(
    store,
    useShallow((state) => state.actions),
  )
}

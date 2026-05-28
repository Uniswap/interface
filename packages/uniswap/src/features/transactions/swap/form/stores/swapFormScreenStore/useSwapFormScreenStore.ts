import { useContext } from 'react'
import type {
  createSwapFormScreenStore,
  SwapFormScreenStoreState,
} from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/createSwapFormScreenStore'
import { SwapFormScreenStoreContext } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/SwapFormScreenStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapFormScreenStoreBase = (): ReturnType<typeof createSwapFormScreenStore> => {
  const store = useContext(SwapFormScreenStoreContext)

  if (!store) {
    throw new Error('useSwapFormScreenStore must be used within SwapFormScreenStoreContextProvider')
  }

  return store
}

export function useSwapFormScreenStore<T>(selector: (state: SwapFormScreenStoreState) => T): T {
  const store = useSwapFormScreenStoreBase()
  return useStore(store, useShallow(selector))
}

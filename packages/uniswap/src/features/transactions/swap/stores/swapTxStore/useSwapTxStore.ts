import { useContext } from 'react'
import { SwapTxStoreContext } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/SwapTxStoreContext'
import type {
  SwapTxStore,
  SwapTxStoreState,
} from 'uniswap/src/features/transactions/swap/stores/swapTxStore/createSwapTxStore'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useSwapTxStoreBase = (): SwapTxStore => {
  const store = useContext(SwapTxStoreContext)

  if (!store) {
    throw new Error('SwapTxStoreContext not found')
  }

  return store
}

export const useSwapTxStore = <U>(selector: (state: SwapTxStoreState) => U): U => {
  const store = useSwapTxStoreBase()

  return useStore(store, useShallow(selector))
}

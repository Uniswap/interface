import { useContext } from 'react'
import type { MarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { MarginFormStoreContext } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContext'
import type { MarginFormStoreState } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/types'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

export const useMarginFormStoreBase = (): MarginFormStore => {
  const store = useContext(MarginFormStoreContext)
  if (!store) {
    throw new Error('useMarginFormStore must be used within MarginFormStoreContextProvider')
  }
  return store
}

export const useMarginFormStore = <T>(selector: (state: Omit<MarginFormStoreState, 'actions'>) => T): T => {
  const store = useMarginFormStoreBase()
  return useStore(store, useShallow(selector))
}

export const useMarginFormStoreActions = (): MarginFormStoreState['actions'] => {
  const store = useMarginFormStoreBase()
  return useStore(
    store,
    useShallow((s) => s.actions),
  )
}

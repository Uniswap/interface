import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'
import type { createTDPStore, TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { TDPStoreContext } from '~/pages/TokenDetails/context/TDPContext'

function useTDPStoreBase(): ReturnType<typeof createTDPStore> {
  const store = useContext(TDPStoreContext)

  if (!store) {
    throw new Error('useTDPStore must be used within TDPStoreContextProvider')
  }

  return store
}

export function useTDPStore<T>(selector: (state: TDPStoreState) => T): T {
  const store = useTDPStoreBase()
  return useStore(store, useShallow(selector))
}

import { useContext } from 'react'
import type {
  GeoRestrictionModalStore,
  GeoRestrictionModalStoreState,
} from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/createGeoRestrictionModalStore'
import { GeoRestrictionModalStoreContext } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionModalStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

const useGeoRestrictionModalStoreBase = (): GeoRestrictionModalStore => {
  const store = useContext(GeoRestrictionModalStoreContext)

  if (!store) {
    throw new Error('GeoRestrictionModalStoreContext not found')
  }

  return store
}

export const useGeoRestrictionModalStore = <U>(selector: (state: GeoRestrictionModalStoreState) => U): U => {
  const store = useGeoRestrictionModalStoreBase()

  return useStore(store, useShallow(selector))
}

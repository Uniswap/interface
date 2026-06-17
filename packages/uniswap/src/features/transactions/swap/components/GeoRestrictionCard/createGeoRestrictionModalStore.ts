import { isDevEnv } from '@universe/environment'
import type { StoreApi, UseBoundStore } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type GeoRestrictionModalStoreState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export type GeoRestrictionModalStore = UseBoundStore<StoreApi<GeoRestrictionModalStoreState>>

export const createGeoRestrictionModalStore = (): GeoRestrictionModalStore =>
  create<GeoRestrictionModalStoreState>()(
    devtools(
      (set) => ({
        isOpen: false,
        open: (): void => set({ isOpen: true }),
        close: (): void => set({ isOpen: false }),
      }),
      {
        name: 'useGeoRestrictionModalStore',
        enabled: isDevEnv(),
        trace: true,
        traceLimit: 25,
      },
    ),
  )

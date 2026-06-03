import { isDevEnv } from '@universe/environment'
import { create } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LoadedTDPContext, PendingTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export type TDPState = PendingTDPContext | LoadedTDPContext

/** Actions for partial store updates; only volatile slices that can change without URL change */
type TDPActions = {
  setTokenQuery: (v: TDPState['tokenQuery']) => void
  setTokenProjectQuery: (v: TDPState['tokenProjectQuery']) => void
  setMultiChainMap: (v: TDPState['multiChainMap']) => void
  setTokenColor: (v: TDPState['tokenColor']) => void
  setCurrency: (v: TDPState['currency']) => void
  setAddress: (v: TDPState['address']) => void
  setSelectedMultichainChainId: (v: TDPState['selectedMultichainChainId']) => void
  setBalanceError: (v: TDPState['balanceError']) => void
}

export type TDPStoreState = TDPState & { actions: TDPActions }

type TDPStore = UseBoundStore<StoreApi<TDPStoreState>>

export const createTDPStore = (initial: TDPState): TDPStore =>
  create<TDPStoreState>()(
    devtools(
      (set) => ({
        ...initial,
        actions: {
          setTokenQuery: (tokenQuery) => set({ tokenQuery }),
          setTokenProjectQuery: (tokenProjectQuery) => set({ tokenProjectQuery }),
          setMultiChainMap: (multiChainMap) => set({ multiChainMap }),
          setTokenColor: (tokenColor) => set({ tokenColor }),
          setCurrency: (currency) => set({ currency }),
          setAddress: (address) => set({ address }),
          setSelectedMultichainChainId: (selectedMultichainChainId) => set({ selectedMultichainChainId }),
          setBalanceError: (balanceError) => set({ balanceError }),
        },
      }),
      {
        name: 'TDPStore',
        enabled: isDevEnv(),
      },
    ),
  )

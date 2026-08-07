import { isDevEnv } from '@universe/environment'
import { create } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { LoadedTDPContext, PendingTDPContext } from '~/pages/TokenDetails/context/TDPContext'

export type TDPState = PendingTDPContext | LoadedTDPContext

/** Actions for partial store updates; only volatile slices that can change without URL change */
export type TDPActions = {
  setTokenQuery: (v: TDPState['tokenQuery']) => void
  setTokenProjectQuery: (v: TDPState['tokenProjectQuery']) => void
  setMultiChainMap: (v: TDPState['multiChainMap']) => void
  setTokenColor: (v: TDPState['tokenColor']) => void
  setCurrency: (v: TDPState['currency']) => void
  setAddress: (v: TDPState['address']) => void
  setSelectedMultichainChainId: (v: TDPState['selectedMultichainChainId']) => void
  setBalanceError: (v: TDPState['balanceError']) => void
  setToken: (v: TDPState['token']) => void
  setMultichainToken: (v: TDPState['multichainToken']) => void
  setMultichainTokenLoaded: (v: TDPState['multichainTokenLoaded']) => void
  setPageQueryLoading: (v: TDPState['pageQueryLoading']) => void
  setChainDataLoading: (v: TDPState['chainDataLoading']) => void
  setMarketDataLoading: (v: TDPState['marketDataLoading']) => void
  incrementRefreshEpoch: () => void
}

export type TDPStoreState = TDPState & { actions: TDPActions; refreshEpoch: number }

type TDPStore = UseBoundStore<StoreApi<TDPStoreState>>

export const createTDPStore = (initial: TDPState): TDPStore =>
  create<TDPStoreState>()(
    devtools(
      (set) => ({
        ...initial,
        refreshEpoch: 0,
        actions: {
          setTokenQuery: (tokenQuery) => set({ tokenQuery }),
          setTokenProjectQuery: (tokenProjectQuery) => set({ tokenProjectQuery }),
          setMultiChainMap: (multiChainMap) => set({ multiChainMap }),
          setTokenColor: (tokenColor) => set({ tokenColor }),
          setCurrency: (currency) => set({ currency }),
          setAddress: (address) => set({ address }),
          setSelectedMultichainChainId: (selectedMultichainChainId) => set({ selectedMultichainChainId }),
          setBalanceError: (balanceError) => set({ balanceError }),
          setToken: (token) => set({ token }),
          setMultichainToken: (multichainToken) => set({ multichainToken }),
          setMultichainTokenLoaded: (multichainTokenLoaded) => set({ multichainTokenLoaded }),
          setPageQueryLoading: (pageQueryLoading) => set({ pageQueryLoading }),
          setChainDataLoading: (chainDataLoading) => set({ chainDataLoading }),
          setMarketDataLoading: (marketDataLoading) => set({ marketDataLoading }),
          incrementRefreshEpoch: () => set((s) => ({ refreshEpoch: s.refreshEpoch + 1 })),
        },
      }),
      {
        name: 'TDPStore',
        enabled: isDevEnv(),
      },
    ),
  )

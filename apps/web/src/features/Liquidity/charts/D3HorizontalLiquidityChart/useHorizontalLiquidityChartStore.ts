import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import {
  HorizontalLiquidityChartStoreContext,
  type HorizontalLiquidityChartStore,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/HorizontalLiquidityChartStoreContext'
import type {
  HorizontalLiquidityChartActions,
  HorizontalLiquidityChartStoreState,
} from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'

export function useHorizontalLiquidityChartStore(): HorizontalLiquidityChartStore {
  const store = useContext(HorizontalLiquidityChartStoreContext)
  if (!store) {
    throw new Error('useHorizontalLiquidityChartStore must be used within a HorizontalLiquidityChartStoreProvider')
  }
  return store
}

export function useHorizontalLiquidityChartStoreActions(): HorizontalLiquidityChartActions {
  const store = useHorizontalLiquidityChartStore()
  return useStore(
    store,
    useShallow((s) => s.actions),
  )
}

export function useHorizontalLiquidityChartSelector<T>(selector: (s: HorizontalLiquidityChartStoreState) => T): T {
  const store = useHorizontalLiquidityChartStore()
  return useStore(store, selector)
}

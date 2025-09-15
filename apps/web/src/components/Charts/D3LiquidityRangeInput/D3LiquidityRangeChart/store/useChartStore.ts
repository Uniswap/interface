import { ChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/ChartStoreContext'
import type {
  ChartActions,
  ChartState,
} from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

function useChartStore() {
  const store = useContext(ChartStoreContext)
  if (!store) {
    throw new Error('useChartStore must be used within a ChartStoreProvider')
  }
  return store
}

export const useChartStoreActions = (): ChartActions => {
  const store = useChartStore()
  return useStore(
    store,
    useShallow((s) => s.actions),
  )
}

export const useChartStoreState = (): ChartState & { defaultState: ChartState } => {
  const store = useChartStore()
  return useStore(
    store,
    useShallow((s) => ({
      zoomLevel: s.zoomLevel,
      panY: s.panY,
      minPrice: s.minPrice,
      maxPrice: s.maxPrice,
      initialViewSet: s.initialViewSet,
      defaultState: s.defaultState,
      dimensions: s.dimensions,
    })),
  )
}

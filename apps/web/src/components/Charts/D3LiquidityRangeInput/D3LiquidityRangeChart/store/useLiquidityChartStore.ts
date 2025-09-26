import { LiquidityChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import type { ChartActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

function useLiquidityChartStore() {
  const store = useContext(LiquidityChartStoreContext)
  if (!store) {
    throw new Error('useLiquidityChartStore must be used within a LiquidityChartStoreProvider')
  }
  return store
}

export const useLiquidityChartStoreActions = (): ChartActions => {
  const store = useLiquidityChartStore()
  return useStore(
    store,
    useShallow((s) => s.actions),
  )
}

import { useContext } from 'react'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { LiquidityChartStoreContext } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'

function useLiquidityChartStore() {
  const store = useContext(LiquidityChartStoreContext)
  if (!store) {
    throw new Error('useLiquidityChartStore must be used within a LiquidityChartStoreProvider')
  }
  return store
}

export const useChartPriceState = () => {
  const store = useLiquidityChartStore()
  return useStore(
    store,
    useShallow((s) => ({
      defaultMinPrice: s.defaultMinPrice,
      defaultMaxPrice: s.defaultMaxPrice,
      isFullRange: s.isFullRange,
      maxPrice: s.maxPrice,
      minPrice: s.minPrice,
      minTick: s.minTick,
      maxTick: s.maxTick,
      selectedHistoryDuration: s.selectedHistoryDuration,
      selectedPriceStrategy: s.selectedPriceStrategy,
      inputMode: s.inputMode,
    })),
  )
}

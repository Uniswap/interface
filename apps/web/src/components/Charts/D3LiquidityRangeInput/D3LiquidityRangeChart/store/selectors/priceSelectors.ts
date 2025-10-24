import { LiquidityChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
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
      selectedHistoryDuration: s.selectedHistoryDuration,
      selectedPriceStrategy: s.selectedPriceStrategy,
      inputMode: s.inputMode,
    })),
  )
}

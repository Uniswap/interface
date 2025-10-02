import { GraphQLApi } from '@universe/api'
import { createLiquidityChartStore } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { LiquidityChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { ReactNode, useEffect, useState } from 'react'

interface LiquidityChartStoreProviderProps {
  children: ReactNode
  minPrice?: number
  maxPrice?: number
  isFullRange?: boolean
  selectedHistoryDuration: GraphQLApi.HistoryDuration
  onMinPriceChange: (price?: number) => void
  onMaxPriceChange: (price?: number) => void
  onTimePeriodChange?: (timePeriod: GraphQLApi.HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}

export function LiquidityChartStoreProvider({
  children,
  minPrice,
  maxPrice,
  isFullRange,
  selectedHistoryDuration,
  onMinPriceChange,
  onMaxPriceChange,
  onTimePeriodChange,
  setIsFullRange,
}: LiquidityChartStoreProviderProps) {
  const [store] = useState(() =>
    createLiquidityChartStore({
      minPrice,
      maxPrice,
      isFullRange,
      selectedHistoryDuration,
      onMinPriceChange,
      onMaxPriceChange,
      onTimePeriodChange,
      setIsFullRange,
    }),
  )

  useEffect(() => {
    if (isFullRange || minPrice === undefined || maxPrice === undefined) {
      return
    }

    store.setState({
      minPrice,
      maxPrice,
    })
  }, [minPrice, maxPrice, isFullRange, store])

  return <LiquidityChartStoreContext.Provider value={store}>{children}</LiquidityChartStoreContext.Provider>
}

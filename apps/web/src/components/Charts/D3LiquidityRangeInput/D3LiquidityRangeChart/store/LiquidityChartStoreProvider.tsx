import { GraphQLApi } from '@universe/api'
import { createLiquidityChartStore } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { LiquidityChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { useLiquidityChartStoreActions } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/useLiquidityChartStore'
import { RangeAmountInputPriceMode } from 'components/Liquidity/Create/types'
import { PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react'

interface LiquidityChartStoreProviderProps {
  inputMode?: RangeAmountInputPriceMode
  children: ReactNode
  minPrice?: number
  maxPrice?: number
  isFullRange?: boolean
  selectedHistoryDuration: GraphQLApi.HistoryDuration
  onInputModeChange: (inputMode: RangeAmountInputPriceMode) => void
  onMinPriceChange: (price?: number) => void
  onMaxPriceChange: (price?: number) => void
  onTimePeriodChange?: (timePeriod: GraphQLApi.HistoryDuration) => void
  setIsFullRange: (isFullRange: boolean) => void
}

function LiquidityChartStoreProviderInner({
  children,
  minPrice,
  maxPrice,
  isFullRange,
}: PropsWithChildren<Pick<LiquidityChartStoreProviderProps, 'minPrice' | 'maxPrice' | 'isFullRange'>>) {
  const store = useContext(LiquidityChartStoreContext)
  const { syncIsFullRangeFromParent } = useLiquidityChartStoreActions()

  // Sync minPrice and maxPrice
  useEffect(() => {
    if (isFullRange || minPrice === undefined || maxPrice === undefined || !store) {
      return
    }

    store.setState({
      minPrice,
      maxPrice,
    })
  }, [minPrice, maxPrice, isFullRange, store])

  // Sync isFullRange
  useEffect(() => {
    syncIsFullRangeFromParent(isFullRange ?? false)
  }, [isFullRange, syncIsFullRangeFromParent])

  return children
}

export function LiquidityChartStoreProvider({
  children,
  inputMode,
  minPrice,
  maxPrice,
  isFullRange,
  selectedHistoryDuration,
  onMinPriceChange,
  onMaxPriceChange,
  onTimePeriodChange,
  onInputModeChange,
  setIsFullRange,
}: LiquidityChartStoreProviderProps) {
  const [store] = useState(() =>
    createLiquidityChartStore({
      inputMode,
      minPrice,
      maxPrice,
      isFullRange,
      selectedHistoryDuration,
      onInputModeChange,
      onMinPriceChange,
      onMaxPriceChange,
      onTimePeriodChange,
      setIsFullRange,
    }),
  )

  return (
    <LiquidityChartStoreContext.Provider value={store}>
      <LiquidityChartStoreProviderInner minPrice={minPrice} maxPrice={maxPrice} isFullRange={isFullRange}>
        {children}
      </LiquidityChartStoreProviderInner>
    </LiquidityChartStoreContext.Provider>
  )
}

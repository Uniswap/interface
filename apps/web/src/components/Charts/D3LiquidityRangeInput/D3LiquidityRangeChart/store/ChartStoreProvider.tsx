import { ChartStoreContext } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/ChartStoreContext'
import { createChartStore } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createChartStore'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import { ReactNode, useState } from 'react'

interface ChartStoreProviderProps {
  children: ReactNode
  priceData: PriceChartData[]
  liquidityData: ChartEntry[]
}

export function ChartStoreProvider({ children, priceData, liquidityData }: ChartStoreProviderProps) {
  const [store] = useState(() => createChartStore({ priceData, liquidityData }))

  return <ChartStoreContext.Provider value={store}>{children}</ChartStoreContext.Provider>
}

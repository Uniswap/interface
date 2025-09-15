import type { ChartStore } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createChartStore'
import { createContext } from 'react'

export const ChartStoreContext = createContext<ChartStore | null>(null)

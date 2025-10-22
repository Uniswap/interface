import type { ChartStore } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { createContext } from 'react'

export const LiquidityChartStoreContext = createContext<ChartStore | null>(null)

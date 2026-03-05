import { createContext } from 'react'
import type { ChartStore } from '~/components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'

export const LiquidityChartStoreContext = createContext<ChartStore | null>(null)

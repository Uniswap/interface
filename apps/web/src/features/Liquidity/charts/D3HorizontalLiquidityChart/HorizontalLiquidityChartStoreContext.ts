import { createContext } from 'react'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { HorizontalLiquidityChartStoreState } from '~/features/Liquidity/charts/D3HorizontalLiquidityChart/types'

export type HorizontalLiquidityChartStore = UseBoundStore<StoreApi<HorizontalLiquidityChartStoreState>>

export const HorizontalLiquidityChartStoreContext = createContext<HorizontalLiquidityChartStore | null>(null)

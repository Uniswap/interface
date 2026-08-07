import { createContext, PropsWithChildren, useContext, useMemo } from 'react'
import { SharedValue, useSharedValue } from 'react-native-reanimated'
import { type ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

interface PriceChartContextValue {
  data: ChartPoint[]
  /** Index of the scrubbed data point; -1 when not scrubbing */
  currentIndex: SharedValue<number>
  isActive: SharedValue<boolean>
}

const PriceChartContext = createContext<PriceChartContextValue | null>(null)

export function PriceChartProvider({ data, children }: PropsWithChildren<{ data: ChartPoint[] }>): JSX.Element {
  const currentIndex = useSharedValue(-1)
  const isActive = useSharedValue(false)

  const value = useMemo(() => ({ data, currentIndex, isActive }), [data, currentIndex, isActive])

  return <PriceChartContext.Provider value={value}>{children}</PriceChartContext.Provider>
}

export function usePriceChart(): PriceChartContextValue {
  const context = useContext(PriceChartContext)
  if (!context) {
    throw new Error('usePriceChart must be used within a PriceChartProvider')
  }
  return context
}

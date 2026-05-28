import { createContext, useContext, type ReactNode } from 'react'
import { useCreateTDPChartState, type TDPChartState } from '~/pages/TokenDetails/components/chart/TDPChartState'

const TDPChartStateContext = createContext<TDPChartState | null>(null)

/** Scoped chart UI state (tab, time range, line vs candle). Wraps `ChartSection` subtree only. */
export function TDPChartStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const value = useCreateTDPChartState()
  return <TDPChartStateContext.Provider value={value}>{children}</TDPChartStateContext.Provider>
}

export function useTDPChartStateContext(): TDPChartState {
  const ctx = useContext(TDPChartStateContext)
  if (!ctx) {
    throw new Error('useTDPChartStateContext must be used within TDPChartStateProvider')
  }
  return ctx
}

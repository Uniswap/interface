import { AnalyticsDebugState, analyticsDebugStore } from 'uniswap/src/features/telemetry/debug/analyticsDebugStore'
import { useStore } from 'zustand'

export function useAnalyticsDebugStore<T>(selector: (state: AnalyticsDebugState) => T): T {
  return useStore(analyticsDebugStore, selector)
}

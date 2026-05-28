import { useEffect, useRef } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

type ExploreQueryType = 'tokens' | 'pools'

interface UseExploreQueryLatencyTrackingOptions {
  queryType: ExploreQueryType
  isBackendSortingEnabled: boolean
  isLoading: boolean
  resultCount: number | undefined
  chainId?: UniverseChainId
}

/**
 * Hook that tracks and reports latency for explore page queries.
 * Measures time from hook mount until data is available.
 * Logs once per mount when data first loads.
 */
export function useExploreQueryLatencyTracking({
  queryType,
  isBackendSortingEnabled,
  isLoading,
  resultCount,
  chainId,
}: UseExploreQueryLatencyTrackingOptions): void {
  const startTimeRef = useRef<number>(performance.now())
  const hasLoggedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!hasLoggedRef.current && !isLoading && resultCount !== undefined && resultCount > 0) {
      const latencyMs = Math.round(performance.now() - startTimeRef.current)
      hasLoggedRef.current = true

      sendAnalyticsEvent(InterfaceEventName.ExploreQueryLatency, {
        query_type: queryType,
        is_backend_sorting_enabled: isBackendSortingEnabled,
        latency_ms: latencyMs,
        chain_id: chainId,
        result_count: resultCount,
      })
    }
  }, [queryType, isBackendSortingEnabled, isLoading, resultCount, chainId])
}

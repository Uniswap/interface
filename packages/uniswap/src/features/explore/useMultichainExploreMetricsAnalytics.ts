import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import { getMultichainRowReductionMetricsFromChainCounts } from 'uniswap/src/features/portfolio/getMultichainPortfolioMetrics'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * Emits {@link UniswapEventName.MultichainExploreMetrics} when explore token row metrics
 * change (e.g. mobile Explore rankings / Home explore list). Only when MultichainTokenUx is enabled.
 */
export function useMultichainExploreMetricsAnalytics({
  rowChainCounts,
  isExploreTokensLoading,
}: {
  rowChainCounts: readonly number[]
  isExploreTokensLoading: boolean
}): void {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const trace = useTrace()
  const traceRef = useRef(trace)
  traceRef.current = trace

  const exploreTableMetrics = useMemo(
    () => getMultichainRowReductionMetricsFromChainCounts(rowChainCounts),
    [rowChainCounts],
  )

  useEffect(() => {
    if (!multichainTokenUxEnabled || isExploreTokensLoading) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.MultichainExploreMetrics, {
      total_token_row_count: exploreTableMetrics.totalTokenRowCount,
      multichain_row_reduction_count: exploreTableMetrics.multichainRowReductionCount,
      multichain_asset_count: exploreTableMetrics.multichainAssetCount,
      ...traceRef.current,
    })
  }, [multichainTokenUxEnabled, isExploreTokensLoading, exploreTableMetrics])
}

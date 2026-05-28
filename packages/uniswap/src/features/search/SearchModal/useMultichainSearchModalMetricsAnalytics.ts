import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { getMultichainRowReductionMetricsFromChainCounts } from 'uniswap/src/features/portfolio/getMultichainPortfolioMetrics'
import { getSearchModalTokenRowChainCounts } from 'uniswap/src/features/search/SearchModal/utils/getSearchModalTokenRowChainCounts'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * Emits {@link UniswapEventName.MultichainSearchMetrics} when search modal token row metrics change
 * (shared mobile + web). Only when MultichainTokenUx is enabled.
 */
export function useMultichainSearchModalMetricsAnalytics({
  sections,
  isSearchResultsLoading,
  isSearchQueryPending,
}: {
  sections: OnchainItemSection<SearchModalOption>[] | undefined
  isSearchResultsLoading: boolean
  /** True while the search query has not caught up to debounced results (user still typing). */
  isSearchQueryPending: boolean
}): void {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const trace = useTrace()
  const traceRef = useRef(trace)
  traceRef.current = trace

  const rowChainCounts = useMemo(() => getSearchModalTokenRowChainCounts(sections), [sections])

  const searchTableMetrics = useMemo(
    () => getMultichainRowReductionMetricsFromChainCounts(rowChainCounts),
    [rowChainCounts],
  )

  useEffect(() => {
    if (!multichainTokenUxEnabled || isSearchResultsLoading || isSearchQueryPending) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.MultichainSearchMetrics, {
      total_token_row_count: searchTableMetrics.totalTokenRowCount,
      multichain_row_reduction_count: searchTableMetrics.multichainRowReductionCount,
      multichain_asset_count: searchTableMetrics.multichainAssetCount,
      ...traceRef.current,
    })
  }, [multichainTokenUxEnabled, isSearchQueryPending, isSearchResultsLoading, searchTableMetrics])
}

import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import { PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import type { SortedPortfolioBalancesMultichain } from 'uniswap/src/features/portfolio/balances/types'
import { getMultichainPortfolioMetrics } from 'uniswap/src/features/portfolio/getMultichainPortfolioMetrics'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * Emits {@link UniswapEventName.MultichainPortfolioMetrics} when portfolio token table
 * metrics change (mobile + extension token list; skips external profiles).
 * Only runs when the MultichainTokenUx feature flag is enabled.
 */
export function useMultichainPortfolioMetricsAnalytics({
  sortedDataForList,
  isExternalProfile,
  isPortfolioBalancesLoading,
}: {
  sortedDataForList: SortedPortfolioBalancesMultichain | undefined
  isExternalProfile: boolean
  isPortfolioBalancesLoading: boolean
}): void {
  const multichainTokenUxEnabled = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const trace = useTrace()
  const traceRef = useRef(trace)
  traceRef.current = trace

  const allBalancesForMetrics = useMemo((): PortfolioMultichainBalance[] => {
    if (!sortedDataForList) {
      return []
    }
    return [...sortedDataForList.balances, ...sortedDataForList.hiddenBalances]
  }, [sortedDataForList])

  const portfolioTableMetrics = useMemo(
    () => getMultichainPortfolioMetrics(allBalancesForMetrics),
    [allBalancesForMetrics],
  )

  useEffect(() => {
    if (!multichainTokenUxEnabled || isExternalProfile || isPortfolioBalancesLoading) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.MultichainPortfolioMetrics, {
      total_token_row_count: portfolioTableMetrics.totalTokenRowCount,
      multichain_row_reduction_count: portfolioTableMetrics.multichainRowReductionCount,
      multichain_asset_count: portfolioTableMetrics.multichainAssetCount,
      ...traceRef.current,
    })
  }, [multichainTokenUxEnabled, isExternalProfile, isPortfolioBalancesLoading, portfolioTableMetrics])
}

import { SharedEventName } from '@uniswap/analytics-events'
import { FeatureFlags, useFeatureFlagWithExposureLoggingDisabled } from '@universe/gating'
import { useDispatch, useSelector } from 'react-redux'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { selectHasDismissedPoolsBalanceCoachmark } from 'uniswap/src/features/behaviorHistory/selectors'
import { setPoolsBalanceCoachmarkDismissed } from 'uniswap/src/features/behaviorHistory/slice'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'

interface UsePoolsBalanceCoachmarkVisibilityParams {
  evmAddress?: Address
  svmAddress?: Address
}

interface UsePoolsBalanceCoachmarkVisibilityResult {
  shouldShow: boolean
  dismiss: () => void
}

/**
 * Per-user visibility for the Portfolio pools-balance coachmark.
 * Reads pool balance from the cache populated by Portfolio Overview (no extra fetch).
 */
export function usePoolsBalanceCoachmarkVisibility({
  evmAddress,
  svmAddress,
}: UsePoolsBalanceCoachmarkVisibilityParams): UsePoolsBalanceCoachmarkVisibilityResult {
  // Read without logging; the pools exposure is logged only where the feature is actually shown (see usePoolsTabVisibility).
  const portfolioPoolsBalancesEnabled = useFeatureFlagWithExposureLoggingDisabled(FeatureFlags.PortfolioPoolsBalances)
  const walletAddress = evmAddress ?? svmAddress

  const hasDismissed = useSelector(selectHasDismissedPoolsBalanceCoachmark)

  const { data: poolsSlice } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress,
    svmAddress,
    cacheOnly: true,
  })

  const hasPoolsBalance = (poolsSlice?.balanceUSD ?? 0) > 0

  const shouldShow = portfolioPoolsBalancesEnabled && !hasDismissed && !!walletAddress && hasPoolsBalance

  const dispatch = useDispatch()
  const dismiss = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.PoolsBalanceCoachmark })
    dispatch(setPoolsBalanceCoachmarkDismissed())
  })

  return { shouldShow, dismiss }
}

import { SharedEventName } from '@uniswap/analytics-events'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { selectPoolsBalanceCoachmarkDismissed } from 'uniswap/src/features/behaviorHistory/selectors'
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
 *
 * Eligibility requires the persisted value to be exactly `false`: an install that predates the pools-balances
 * launch (marked by migration) and hasn't dismissed it. `undefined` is state created after launch, never shown.
 * An eligible wallet evaluated with zero pool balance is dismissed permanently — no pools when the
 * feature reaches the user means they never see the coachmark, even if they open positions later.
 */
export function usePoolsBalanceCoachmarkVisibility({
  evmAddress,
  svmAddress,
}: UsePoolsBalanceCoachmarkVisibilityParams): UsePoolsBalanceCoachmarkVisibilityResult {
  const walletAddress = evmAddress ?? svmAddress

  const isEligible = useSelector(selectPoolsBalanceCoachmarkDismissed) === false

  const { data: poolsSlice } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress,
    svmAddress,
    cacheOnly: true,
  })

  // `undefined` means loading or slice unavailable — never a basis for the permanent auto-dismiss below.
  const isPoolsBalanceLoaded = poolsSlice?.balanceUSD !== undefined
  const hasPoolsBalance = (poolsSlice?.balanceUSD ?? 0) > 0

  const dispatch = useDispatch()

  useEffect(() => {
    if (isEligible && !!walletAddress && isPoolsBalanceLoaded && !hasPoolsBalance) {
      dispatch(setPoolsBalanceCoachmarkDismissed())
    }
  }, [isEligible, walletAddress, isPoolsBalanceLoaded, hasPoolsBalance, dispatch])

  const shouldShow = isEligible && !!walletAddress && hasPoolsBalance

  const dismiss = useEvent(() => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, { element: ElementName.PoolsBalanceCoachmark })
    dispatch(setPoolsBalanceCoachmarkDismissed())
  })

  return { shouldShow, dismiss }
}

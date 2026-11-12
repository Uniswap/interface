import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { shouldStayAfterConnect, useRedirectAfterConnectStore } from '~/features/wallet/hooks/useRedirectAfterConnect'

const BALANCE_WAIT_TIMEOUT_MS = 3 * ONE_SECOND_MS

/**
 * Resolves redirects requested through `useRedirectAfterConnect`. Mounted once in the app chrome so a request
 * outlives the modal or page that made it. A slow or failed balance query falls back after a timeout.
 */
export function RedirectAfterConnect(): null {
  const navigate = useNavigate()
  const pending = useRedirectAfterConnectStore((state) => state.pending)
  const clear = useRedirectAfterConnectStore((state) => state.clear)
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  // Testnet balances always read $0, which would send every testnet wallet to Portfolio.
  const { isTestnetModeEnabled } = useEnabledChains()
  // Addresses can land a render after the connect request, so the query waits for them instead of bailing.
  const { evmAddress, svmAddress } = useActiveAddresses()
  const shouldCheckBalance =
    !!pending &&
    isNewUserUxEnabled &&
    !isTestnetModeEnabled &&
    !shouldStayAfterConnect(pending.pathname, pending.fallbackPath)

  const isBalanceQueryEnabled = shouldCheckBalance && !!(evmAddress ?? svmAddress)
  // Same params as the nav balance pill, so both share one cache entry.
  const { data, error, dataUpdatedAt, errorUpdatedAt, loading, refetch } = usePortfolioTotalValue({
    evmAddress,
    svmAddress,
    enabled: isBalanceQueryEnabled,
  })
  // A cached balance from before the connect (e.g. for the address set before a second wallet landed) can't decide.
  const isBalanceFresh = !!pending && !!dataUpdatedAt && dataUpdatedAt >= pending.requestedAt
  const isErrorFresh = !!pending && !!errorUpdatedAt && errorUpdatedAt >= pending.requestedAt
  const hasStaleResult = (!!data && !isBalanceFresh) || (!!error && !isErrorFresh)

  // A cache entry inside its stale time won't refetch on its own, so a reconnect would otherwise wait out the timeout.
  useEffect(() => {
    if (isBalanceQueryEnabled && hasStaleResult && !loading) {
      refetch()
    }
  }, [isBalanceQueryEnabled, hasStaleResult, loading, refetch])

  const finish = useEvent((path: string | undefined) => {
    clear()
    // Already there (e.g. connecting on Portfolio): navigating again would only push a duplicate history entry.
    if (path && path !== window.location.pathname) {
      navigate(path)
    }
  })

  useEffect(() => {
    if (!pending) {
      return
    }
    if (!shouldCheckBalance) {
      finish(pending.fallbackPath)
    } else if (isBalanceFresh && data?.balanceUSD === 0) {
      if (window.location.pathname !== '/portfolio') {
        sendAnalyticsEvent(InterfaceEventName.UnfundedRedirectToPortfolio, { source: 'connect' })
      }
      finish('/portfolio')
    } else if (isBalanceFresh || isErrorFresh) {
      finish(pending.fallbackPath)
    }
  }, [pending, shouldCheckBalance, isBalanceFresh, isErrorFresh, data, finish])

  useEffect(() => {
    if (!pending) {
      return undefined
    }
    const timeoutId = setTimeout(() => finish(pending.fallbackPath), BALANCE_WAIT_TIMEOUT_MS)
    return () => clearTimeout(timeoutId)
  }, [pending, finish])

  return null
}

import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { createAdaptiveRefetchContext } from 'graphql/data/apollo/AdaptiveRefetch'
import { useAssetActivitySubscription } from 'graphql/data/apollo/AssetActivityProvider'
import { GQL_MAINNET_CHAINS_MUTABLE } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import {
  OnAssetActivitySubscription,
  PortfolioBalancesWebQueryResult,
  SwapOrderStatus,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  usePortfolioBalancesWebLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SUBSCRIPTION_CHAINIDS } from 'utilities/src/apollo/constants'
import { usePrevious } from 'utilities/src/react/hooks'

const {
  Provider: AdaptiveTokenBalancesProvider,
  useQuery: useTokenBalancesQuery,
  PrefetchWrapper: PrefetchBalancesWrapper,
} = createAdaptiveRefetchContext<PortfolioBalancesWebQueryResult>()

/** Returns whether an update may affect token balances. */
function mayAffectTokenBalances(data?: OnAssetActivitySubscription) {
  // Special case: non-filled order status updates do not affect balances.
  if (
    data?.onAssetActivity?.details.__typename === 'SwapOrderDetails' &&
    data.onAssetActivity.details.orderStatus !== SwapOrderStatus.Filled
  ) {
    return false
  }

  return true
}

function useIsRealtime() {
  const { chainId } = useAccount()
  const isRealtimeEnabled = useFeatureFlag(FeatureFlags.Realtime)

  return isRealtimeEnabled && chainId && SUBSCRIPTION_CHAINIDS.includes(chainId)
}

function useHasAccountUpdate() {
  // Used to detect account updates without relying on subscription data.
  const { pendingActivityCount } = usePendingActivity()
  const prevPendingActivityCount = usePrevious(pendingActivityCount)
  const hasLocalStateUpdate = !!prevPendingActivityCount && pendingActivityCount < prevPendingActivityCount

  const isRealtime = useIsRealtime()

  const { data } = useAssetActivitySubscription()
  const prevData = usePrevious(data)

  const account = useAccount()
  const prevAccount = usePrevious(account.address)

  return useMemo(() => {
    const hasPolledTxUpdate = !isRealtime && hasLocalStateUpdate
    const hasSubscriptionTxUpdate = data !== prevData && mayAffectTokenBalances(data)
    const accountChanged = Boolean(prevAccount !== account.address && account.address)

    return hasPolledTxUpdate || hasSubscriptionTxUpdate || accountChanged
  }, [account.address, data, hasLocalStateUpdate, isRealtime, prevAccount, prevData])
}

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [lazyFetch, query] = usePortfolioBalancesWebLazyQuery()
  const account = useAccount()
  const hasAccountUpdate = useHasAccountUpdate()

  const fetch = useCallback(() => {
    if (!account.address) {
      return
    }
    lazyFetch({ variables: { ownerAddress: account.address, chains: GQL_MAINNET_CHAINS_MUTABLE } })
  }, [account.address, lazyFetch])

  return (
    <AdaptiveTokenBalancesProvider query={query} fetch={fetch} stale={hasAccountUpdate}>
      {children}
    </AdaptiveTokenBalancesProvider>
  )
}

/**
 * Retrieves cached token balances, avoiding new fetches to reduce backend load.
 * Analytics should use balances from transaction flows instead of initiating fetches at pageload.
 */
export function useTotalBalancesUsdForAnalytics(): number | undefined {
  return useTokenBalancesQuery({ cacheOnly: true }).data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value
}

export { PrefetchBalancesWrapper, useTokenBalancesQuery }

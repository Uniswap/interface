import { useWeb3React } from '@web3-react/core'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { GQL_MAINNET_CHAINS_MUTABLE } from 'graphql/data/util'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useActiveSmartPool } from 'state/application/hooks'
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
import { useChainId } from 'wagmi'

import { createAdaptiveRefetchContext } from './AdaptiveRefetch'
import { useAssetActivitySubscription } from './AssetActivityProvider'

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
  const chainId = useChainId()
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

  const { account } = useWeb3React()
  const prevAccount = usePrevious(account)

  const { address: smartPool } = useActiveSmartPool()
  const prevSmartPool = usePrevious(smartPool)

  return useMemo(() => {
    const hasPolledTxUpdate = !isRealtime && hasLocalStateUpdate
    const hasSubscriptionTxUpdate = data !== prevData && mayAffectTokenBalances(data)
    const accountChanged = Boolean(prevAccount !== account && account)
    const smartPoolChanged = Boolean(prevSmartPool !== smartPool && smartPool)

    return hasPolledTxUpdate || hasSubscriptionTxUpdate || accountChanged || smartPoolChanged
  }, [account, data, smartPool, hasLocalStateUpdate, isRealtime, prevAccount, prevData, prevSmartPool])
}

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [lazyFetch, query] = usePortfolioBalancesWebLazyQuery()
  const { account } = useWeb3React()
  const hasAccountUpdate = useHasAccountUpdate()
  // TODO: query default pool with hook and either conditionally set, or just use pool
  const { address: smartPoolAddress } = useActiveSmartPool()

  const fetch = useCallback(() => {
    if (!account) return
    lazyFetch({ variables: { ownerAddress: smartPoolAddress ?? account, chains: GQL_MAINNET_CHAINS_MUTABLE } })
  }, [account, smartPoolAddress, lazyFetch])

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
export function useTotalBalancesUsdForAnalytics() {
  return useTokenBalancesQuery({ cacheOnly: true }).data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value
}

export { PrefetchBalancesWrapper, useTokenBalancesQuery }

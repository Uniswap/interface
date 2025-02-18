import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { AdaptiveTokenBalancesProvider } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAssetActivitySubscription } from 'graphql/data/apollo/AssetActivityProvider'
import { apolloClient } from 'graphql/data/apollo/client'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react'
import { useWatchTransactionsCallback } from 'state/sagas/transactions/watcherSaga'
import { usePendingTransactions } from 'state/transactions/hooks'
import {
  OnAssetActivitySubscription,
  SwapOrderStatus,
  usePortfolioBalancesLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
// eslint-disable-next-line no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SUBSCRIPTION_CHAINIDS } from 'utilities/src/apollo/constants'
import { usePrevious } from 'utilities/src/react/hooks'

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

  return isRealtimeEnabled && chainId && (SUBSCRIPTION_CHAINIDS as unknown as UniverseChainId[]).includes(chainId)
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

  const { isTestnetModeEnabled } = useEnabledChains()
  const prevIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  return useMemo(() => {
    const hasPolledTxUpdate = !isRealtime && hasLocalStateUpdate
    const hasSubscriptionTxUpdate = data !== prevData && mayAffectTokenBalances(data)
    const accountChanged = Boolean(prevAccount !== account.address && account.address)
    const hasTestnetModeChanged = prevIsTestnetModeEnabled !== isTestnetModeEnabled

    return hasPolledTxUpdate || hasSubscriptionTxUpdate || accountChanged || hasTestnetModeChanged
  }, [
    account.address,
    data,
    hasLocalStateUpdate,
    isRealtime,
    prevAccount,
    prevData,
    prevIsTestnetModeEnabled,
    isTestnetModeEnabled,
  ])
}

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [lazyFetch, query] = usePortfolioBalancesLazyQuery({ errorPolicy: 'all' })
  const account = useAccount()
  const hasAccountUpdate = useHasAccountUpdate()

  const valueModifiers = usePortfolioValueModifiers(account.address)
  const prevValueModifiers = usePrevious(valueModifiers)

  const { gqlChains } = useEnabledChains()
  const pendingTransactions = usePendingTransactions()
  const prevPendingTransactions = usePrevious(pendingTransactions)
  const pendingDiff = useMemo(
    () => prevPendingTransactions?.filter((tx) => !pendingTransactions.includes(tx)),
    [pendingTransactions, prevPendingTransactions],
  )
  const watchTransactions = useWatchTransactionsCallback()

  useEffect(() => {
    if (!account.address || !account.chainId) {
      return
    }

    if (!pendingDiff?.length) {
      return
    }

    watchTransactions({
      address: account.address,
      chainId: account.chainId,
      pendingDiff,
      apolloClient,
    })
  }, [pendingDiff, account.address, account.chainId, watchTransactions])

  const fetch = useCallback(() => {
    if (!account.address) {
      return
    }

    lazyFetch({
      variables: {
        ownerAddress: account.address,
        chains: gqlChains,
        valueModifiers,
      },
    })
  }, [account.address, gqlChains, lazyFetch, valueModifiers])

  return (
    <AdaptiveTokenBalancesProvider
      query={query}
      fetch={fetch}
      stale={hasAccountUpdate || valueModifiers !== prevValueModifiers}
    >
      {children}
    </AdaptiveTokenBalancesProvider>
  )
}

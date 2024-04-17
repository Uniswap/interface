import { QueryResult } from '@apollo/client'
import { useWeb3React } from '@web3-react/core'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { GQL_MAINNET_CHAINS_MUTABLE } from 'graphql/data/util'
import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  Chain,
  Exact,
  OnAssetActivitySubscription,
  PortfolioBalancesWebQuery,
  SwapOrderStatus,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  usePortfolioBalancesWebLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/statsig/flags'
import { useFeatureFlag } from 'uniswap/src/features/statsig/hooks'
import { SUBSCRIPTION_CHAINIDS } from 'utilities/src/apollo/constants'
import { usePrevious } from 'utilities/src/react/hooks'
import { useAssetActivitySubscription } from './AssetActivityProvider'

type BalanceQueryResult = QueryResult<
  PortfolioBalancesWebQuery,
  Exact<{
    ownerAddress: string
    chains: Chain | Chain[]
  }>
>

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

type UnsubscribeFunction = () => void
const TokenBalancesContext = createContext<
  | {
      query: BalanceQueryResult
      subscribe: UnsubscribeFunction
      prefetch: () => void
    }
  | undefined
>(undefined)

function useIsRealtime() {
  const { chainId } = useWeb3React()
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

  return useMemo(() => {
    const hasPolledTxUpdate = !isRealtime && hasLocalStateUpdate
    const hasSubscriptionTxUpdate = data !== prevData && mayAffectTokenBalances(data)
    const accountChanged = Boolean(prevAccount !== account && account)

    return hasPolledTxUpdate || hasSubscriptionTxUpdate || accountChanged
  }, [account, data, hasLocalStateUpdate, isRealtime, prevAccount, prevData])
}

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [lazyFetch, query] = usePortfolioBalancesWebLazyQuery()
  const { account } = useWeb3React()
  const hasAccountUpdate = useHasAccountUpdate()

  // Tracks the number of components currently using balance state; If 0, account updates will not cause refetch.
  const [numSubscribers, setNumSubscribers] = useState(0)

  // Tracks whether or not the current query data is undefined or out of date to avoid unnecessary refetches.
  const [stale, setStale] = useState(true)

  // Fetch balances or mark balances as stale when account updates are detected.
  useEffect(() => {
    if (hasAccountUpdate || stale) {
      if (numSubscribers && account) {
        setStale(false)
        lazyFetch({ variables: { ownerAddress: account, chains: GQL_MAINNET_CHAINS_MUTABLE } })
      } else {
        // If no components are currently using balance state, mark balances as stale.
        setStale(true)
      }
    }
  }, [hasAccountUpdate, numSubscribers, stale, account, lazyFetch])

  // Passed to other components to prefetch balances when stale, i.e. upon hovering a component that will display balances once clicked.
  const prefetch = useCallback(() => {
    if (!stale || !account) return
    setStale(false)
    lazyFetch({ variables: { ownerAddress: account, chains: GQL_MAINNET_CHAINS_MUTABLE } })
  }, [lazyFetch, stale, account])

  return (
    <TokenBalancesContext.Provider
      value={useMemo(
        () => ({
          query,
          prefetch,
          subscribe: () => {
            setNumSubscribers((prev) => prev + 1)
            return () => setNumSubscribers((prev) => prev - 1)
          },
        }),
        [query, prefetch]
      )}
    >
      {children}
    </TokenBalancesContext.Provider>
  )
}

export function PrefetchBalancesWrapper({ children, className }: PropsWithChildren<{ className?: string }>) {
  const balanceContext = useContext(TokenBalancesContext)
  if (!balanceContext) throw new Error('PrefetchBalancesWrapper must be used within a TokenBalancesProvider')
  const { prefetch } = balanceContext

  return (
    <div className={className} onMouseEnter={prefetch}>
      {children}
    </div>
  )
}

/**
 * Returns data pertaining to the currently-connected account's token balances. Kept up-to-date via subscriptions.
 * @param options.skip - If true, this hook will not trigger a prefetch, and will instead return only on cached data.
 */
export function useTokenBalancesQuery(options?: { skip?: boolean }) {
  const balanceContext = useContext(TokenBalancesContext)
  if (!balanceContext) throw new Error('useTokenBalancesQuery must be used within an Apollo Provider')

  const { query, subscribe } = balanceContext

  // Subscribing/unsubscribing allows TokenBalanceProvider to track whether components are currently displaying balances or not, impacting whether or not to fetch balances upon account updates.
  useEffect(() => {
    if (options?.skip) return

    return subscribe()
  }, [options?.skip, subscribe])

  return query
}

/**
 * Retrieves cached token balances, avoiding new fetches to reduce backend load.
 * Analytics should use balances from transaction flows instead of initiating fetches at pageload.
 */
export function useTotalBalancesUsdForAnalytics() {
  return useTokenBalancesQuery({ skip: true })?.data?.portfolios?.[0]?.tokensTotalDenominatedValue?.value
}

import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { AdaptiveTokenBalancesProvider } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAssetActivitySubscription } from 'graphql/data/apollo/AssetActivityProvider'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useCallback, useMemo } from 'react'
import {
  OnAssetActivitySubscription,
  SwapOrderStatus,
  usePortfolioBalancesLazyQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import {
  useEnabledChains,
  useHideSmallBalancesSetting,
  useHideSpamTokensSetting,
} from 'uniswap/src/features/settings/hooks'
import { UniverseChainId } from 'uniswap/src/types/chains'
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

function usePortfolioValueModifiers(): {
  includeSmallBalances: boolean
  includeSpamTokens: boolean
} {
  const hideSmallBalances = useHideSmallBalancesSetting()
  const hideSpamTokens = useHideSpamTokensSetting()
  return useMemo(
    () => ({
      includeSmallBalances: !hideSmallBalances,
      includeSpamTokens: !hideSpamTokens,
    }),
    [hideSmallBalances, hideSpamTokens],
  )
}

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [lazyFetch, query] = usePortfolioBalancesLazyQuery({ errorPolicy: 'all' })
  const account = useAccount()
  const hasAccountUpdate = useHasAccountUpdate()
  const valueModifiers = usePortfolioValueModifiers()
  const prevValueModifiers = usePrevious(valueModifiers)
  const { gqlChains } = useEnabledChains()

  const fetch = useCallback(() => {
    if (!account.address) {
      return
    }
    // adds a 3 second delay to account for dependency latency after an account update
    // TODO(WEB-5370): Remove this delay once we've integrated wallet's refetch logic
    setTimeout(
      () => {
        account.address &&
          lazyFetch({
            variables: {
              ownerAddress: account.address,
              chains: gqlChains,
              valueModifiers: [
                {
                  ownerAddress: account.address,
                  includeSpamTokens: valueModifiers.includeSpamTokens,
                  includeSmallBalances: valueModifiers.includeSmallBalances,
                  tokenExcludeOverrides: [],
                  tokenIncludeOverrides: [],
                },
              ],
            },
          })
      },
      hasAccountUpdate ? 3000 : 0,
    )
  }, [
    account.address,
    hasAccountUpdate,
    lazyFetch,
    gqlChains,
    valueModifiers.includeSpamTokens,
    valueModifiers.includeSmallBalances,
  ])

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

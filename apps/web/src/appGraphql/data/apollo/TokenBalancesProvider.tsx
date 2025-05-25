import { AdaptiveTokenBalancesProvider } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { apolloClient } from 'appGraphql/data/apollo/client'
import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import { useWatchTransactionsCallback } from 'state/sagas/transactions/watcherSaga'
import { usePendingTransactions } from 'state/transactions/hooks'
import { usePortfolioBalancesLazyQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { usePortfolioValueModifiers } from 'uniswap/src/features/dataApi/balances'
import { usePrevious } from 'utilities/src/react/hooks'

function useHasAccountUpdate() {
  // Used to detect account updates without relying on subscription data.
  const { pendingActivityCount } = usePendingActivity()
  const prevPendingActivityCount = usePrevious(pendingActivityCount)
  const hasLocalStateUpdate = !!prevPendingActivityCount && pendingActivityCount < prevPendingActivityCount

  const account = useAccount()
  const prevAccount = usePrevious(account.address)

  const { isTestnetModeEnabled } = useEnabledChains()
  const prevIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  return useMemo(() => {
    const hasPolledTxUpdate = hasLocalStateUpdate
    const accountChanged = Boolean(prevAccount !== account.address && account.address)
    const hasTestnetModeChanged = prevIsTestnetModeEnabled !== isTestnetModeEnabled

    return hasPolledTxUpdate || accountChanged || hasTestnetModeChanged
  }, [account.address, hasLocalStateUpdate, prevAccount, prevIsTestnetModeEnabled, isTestnetModeEnabled])
}

function TokenBalancesProviderInternal({ children }: PropsWithChildren) {
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

export function TokenBalancesProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    setInitialized(true)
  }, [])

  if (!initialized) {
    return null
  }

  return <TokenBalancesProviderInternal>{children}</TokenBalancesProviderInternal>
}

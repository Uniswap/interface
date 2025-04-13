import { usePendingActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { AdaptiveTokenBalancesProvider } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { apolloClient } from 'graphql/data/apollo/client'
import { useAccount } from 'hooks/useAccount'
import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useActiveSmartPool } from 'state/application/hooks'
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

  const { address: smartPool } = useActiveSmartPool()
  const prevSmartPool = usePrevious(smartPool)

  const { pathname: page } = useLocation()
  const prevPage = usePrevious(page)

  const { isTestnetModeEnabled } = useEnabledChains()
  const prevIsTestnetModeEnabled = usePrevious(isTestnetModeEnabled)

  return useMemo(() => {
    const hasPolledTxUpdate = hasLocalStateUpdate
    const accountChanged = Boolean(prevAccount !== account.address && account.address)
    const hasTestnetModeChanged = prevIsTestnetModeEnabled !== isTestnetModeEnabled
    const smartPoolChanged = Boolean(prevSmartPool !== smartPool && smartPool)
    const sendPageChanged = page !== prevPage && !!smartPool && (page === '/send' || prevPage === '/send')

    return hasPolledTxUpdate || accountChanged || hasTestnetModeChanged || smartPoolChanged || sendPageChanged
  }, [
    account.address,
    smartPool,
    page,
    hasLocalStateUpdate,
    prevAccount,
    prevSmartPool,
    prevPage,
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
  // TODO: query default pool with hook and either conditionally set, or just use pool
  const { address: smartPoolAddress } = useActiveSmartPool()

  // TODO: define shouldQueryPoolBalances as useMemo to check if we can set correct state without further updating
  // on send we only allow user token transfer, as smart pool cannot execute arbitrary transfers
  const { pathname: page } = useLocation()
  const isSendPage = page === '/send'
  const shouldQueryPoolBalances = smartPoolAddress && !isSendPage

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
        ownerAddress: shouldQueryPoolBalances ? smartPoolAddress : account.address,
        chains: gqlChains,
        valueModifiers,
      },
    })
  }, [account.address, gqlChains, lazyFetch, valueModifiers, smartPoolAddress, shouldQueryPoolBalances])

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

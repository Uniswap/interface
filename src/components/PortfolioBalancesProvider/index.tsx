import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesLazyQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from 'graphql/data/util'
import usePrevious from 'hooks/usePrevious'
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import noop from 'utils/noop'

import { usePendingActivity } from '../AccountDrawer/MiniPortfolio/Activity/hooks'

const BalancesContext = createContext<{
  query?: ReturnType<typeof usePortfolioBalancesQuery>
  fetch: () => void
  stale: boolean
}>({} as any)

/** Returns true if the number of pending activities has decreased */
function useHasUpdatedTx() {
  const { pendingActivityCount } = usePendingActivity()
  const prevPendingActivityCount = usePrevious(pendingActivityCount)

  return !!prevPendingActivityCount && pendingActivityCount < prevPendingActivityCount
}

function useHasAccountChanged() {
  const { account } = useWeb3React()
  const prevAccount = usePrevious(account)

  return !!prevAccount && account !== prevAccount
}

export function PortfolioBalancesProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3React()
  const [stale, setStale] = useState(true)

  const [fetch, balanceQuery] = usePortfolioBalancesLazyQuery({
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
  })

  // Set stale flag to false when new balances are being fetched
  useEffect(() => {
    if (balanceQuery.loading === true) setStale(false)
  }, [balanceQuery.loading, setStale])

  // Set stale flag to true when the user completes a transaction or switches accounts
  const hasUpdatedTx = useHasUpdatedTx()
  const accountChanged = useHasAccountChanged()
  useEffect(() => {
    if (hasUpdatedTx || accountChanged) setStale(true)
  }, [accountChanged, hasUpdatedTx, setStale])

  return (
    <BalancesContext.Provider
      value={useMemo(() => ({ fetch, query: balanceQuery, stale }), [fetch, balanceQuery, stale])}
    >
      {children}
    </BalancesContext.Provider>
  )
}

// Used to prevent state updates in unit tests
export function MockBalanceProvider({ children }: { children: ReactNode }) {
  return (
    <BalancesContext.Provider value={useMemo(() => ({ stale: false, fetch: noop }), [])}>
      {children}
    </BalancesContext.Provider>
  )
}

export function useCachedPortfolioBalances(params?: { freshBalancesRequired: boolean }) {
  const { query, fetch, stale } = useContext(BalancesContext)
  const { account } = useWeb3React()

  // Fetches new balances when existing balances are stale and the UI requires fresh balances (e.g. component goes from hidden to visible)
  useEffect(() => {
    if (stale && params?.freshBalancesRequired && account) fetch()
  }, [stale, params?.freshBalancesRequired, account, fetch])

  return useMemo(
    () => ({ portfolio: query?.data?.portfolios?.[0], loading: query?.loading }),
    [query?.data?.portfolios, query?.loading]
  )
}

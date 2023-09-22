import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesLazyQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from 'graphql/data/util'
import usePrevious from 'hooks/usePrevious'
import { atom, useAtom } from 'jotai'
import { PropsWithChildren, useCallback, useEffect } from 'react'

import { usePendingActivity } from '../AccountDrawer/MiniPortfolio/Activity/hooks'

/** Returns true if the number of pending activities has decreased */
function useHasUpdatedTx() {
  const { pendingActivityCount } = usePendingActivity()
  const prevPendingActivityCount = usePrevious(pendingActivityCount)

  return !!prevPendingActivityCount && pendingActivityCount < prevPendingActivityCount
}

export function useCachedPortfolioBalancesQuery({ account }: { account?: string }) {
  return usePortfolioBalancesQuery({
    skip: !account,
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy: 'cache-only', // PrefetchBalancesWrapper handles balance fetching/staleness; this component only reads from cache
    errorPolicy: 'all',
  })
}

const hasUnfetchedBalancesAtom = atom<boolean>(true)

/* Prefetches & caches portfolio balances when the wrapped component is hovered or the user completes a transaction */
export default function PrefetchBalancesWrapper({
  children,
  shouldFetchOnAccountUpdate,
  className,
}: PropsWithChildren<{ shouldFetchOnAccountUpdate: boolean; className?: string }>) {
  const { account } = useWeb3React()
  const [prefetchPortfolioBalances] = usePortfolioBalancesLazyQuery()

  // Use an atom to track unfetched state to avoid duplicating fetches if this component appears multiple times on the page.
  const [hasUnfetchedBalances, setHasUnfetchedBalances] = useAtom(hasUnfetchedBalancesAtom)
  const fetchBalances = useCallback(() => {
    if (account) {
      prefetchPortfolioBalances({ variables: { ownerAddress: account, chains: GQL_MAINNET_CHAINS } })
      setHasUnfetchedBalances(false)
    }
  }, [account, prefetchPortfolioBalances, setHasUnfetchedBalances])

  const prevAccount = usePrevious(account)

  const hasUpdatedTx = useHasUpdatedTx()
  // Listens for account changes & recently updated transactions to keep portfolio balances fresh in apollo cache
  useEffect(() => {
    const accountChanged = prevAccount !== undefined && prevAccount !== account
    if (hasUpdatedTx || accountChanged) {
      // The parent configures whether these conditions should trigger an immediate fetch,
      // if not, we set a flag to fetch on next hover.
      if (shouldFetchOnAccountUpdate) {
        fetchBalances()
      } else {
        setHasUnfetchedBalances(true)
      }
    }
  }, [account, prevAccount, shouldFetchOnAccountUpdate, fetchBalances, hasUpdatedTx, setHasUnfetchedBalances])

  const onHover = useCallback(() => {
    if (hasUnfetchedBalances) fetchBalances()
  }, [fetchBalances, hasUnfetchedBalances])

  return (
    <div onMouseEnter={onHover} className={className}>
      {children}
    </div>
  )
}

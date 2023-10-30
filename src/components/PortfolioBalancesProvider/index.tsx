import { useWeb3React } from '@web3-react/core'
import { usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { GQL_MAINNET_CHAINS } from 'graphql/data/util'
import usePrevious from 'hooks/usePrevious'
import { atom, useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { ReactNode, useEffect } from 'react'

import { usePendingActivity } from '../AccountDrawer/MiniPortfolio/Activity/hooks'

const hasUnfetchedBalancesAtom = atom<boolean>(true)

/** Returns true if the number of pending activities has decreased */
function useHasUpdatedTx() {
  const { pendingActivityCount } = usePendingActivity()
  const prevPendingActivityCount = usePrevious(pendingActivityCount)

  return !!prevPendingActivityCount && pendingActivityCount < prevPendingActivityCount
}

export function PortfolioBalancesProvider({ children }: { children: ReactNode }) {
  const { account } = useWeb3React()
  const setHasStaleBalances = useUpdateAtom(hasUnfetchedBalancesAtom)

  const cachedBalances = usePortfolioBalancesQuery({
    skip: !account,
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy: 'cache-only',
  }).data?.portfolios?.[0]

  // Set stale flag to false when new balances are received
  useEffect(() => {
    if (cachedBalances) setHasStaleBalances(false)
  }, [cachedBalances, setHasStaleBalances])

  // Set stale flag to true when the user completes a transaction or switches accounts
  const hasUpdatedTx = useHasUpdatedTx()
  const prevAccount = usePrevious(account)
  useEffect(() => {
    const accountChanged = prevAccount !== undefined && prevAccount !== account
    if (hasUpdatedTx || accountChanged) setHasStaleBalances(true)
  }, [account, hasUpdatedTx, prevAccount, setHasStaleBalances])

  return <>{children}</>
}

export function useCachedPortfolioBalances(params?: { freshBalancesRequired: boolean }) {
  const { account } = useWeb3React()
  const [hasStaleBalances, setHasStaleBalances] = useAtom(hasUnfetchedBalancesAtom)

  const { data, loading, refetch } = usePortfolioBalancesQuery({
    variables: { ownerAddress: account ?? '', chains: GQL_MAINNET_CHAINS },
    fetchPolicy: 'cache-only',
  })

  // Fetches new balances when existing balances are stale and the UI requires fresh balances (e.g. component goes from hidden to visible)
  useEffect(() => {
    if (hasStaleBalances && params?.freshBalancesRequired && account) {
      refetch()
      setHasStaleBalances(false)
    }
  }, [params?.freshBalancesRequired, refetch, hasStaleBalances, account, setHasStaleBalances])

  return { portfolio: data?.portfolios?.[0], stale: hasStaleBalances, loading }
}

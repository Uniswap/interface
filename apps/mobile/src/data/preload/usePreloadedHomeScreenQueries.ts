import { useEffect } from 'react'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'
import {
  usePortfolioBalancesLazyQuery,
  useTransactionListLazyQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'

/** Preloaded home screen queries that reload on active account change */
export function usePreloadedHomeScreenQueries(): void {
  const [loadPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const [loadTransactionHistory] = useTransactionListLazyQuery()

  const activeAccountAddress = useActiveAccountAddress()

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    loadPortfolioBalances({ variables: { ownerAddress: activeAccountAddress } })
    loadTransactionHistory({ variables: { address: activeAccountAddress } })
  }, [activeAccountAddress, loadPortfolioBalances, loadTransactionHistory])
}

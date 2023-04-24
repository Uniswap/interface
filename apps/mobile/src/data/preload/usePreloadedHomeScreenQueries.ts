import { useEffect } from 'react'
import {
  usePortfolioBalanceLazyQuery,
  usePortfolioBalancesLazyQuery,
  useTransactionListLazyQuery,
} from 'src/data/__generated__/types-and-hooks'
import { useActiveAccountAddress } from 'src/features/wallet/hooks'

/** Preloaded home screen queries that reload on active account change */
export function usePreloadedHomeScreenQueries(): void {
  const [loadPortfolioBalance] = usePortfolioBalanceLazyQuery()
  const [loadPortfolioBalances] = usePortfolioBalancesLazyQuery()
  const [loadTransactionHistory] = useTransactionListLazyQuery()

  const activeAccountAddress = useActiveAccountAddress()

  useEffect(() => {
    if (!activeAccountAddress) {
      return
    }

    loadPortfolioBalance({ variables: { owner: activeAccountAddress } })
    loadPortfolioBalances({ variables: { ownerAddress: activeAccountAddress } })
    loadTransactionHistory({ variables: { address: activeAccountAddress } })
  }, [activeAccountAddress, loadPortfolioBalance, loadPortfolioBalances, loadTransactionHistory])
}

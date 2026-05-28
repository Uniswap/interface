import { GqlResult } from '@universe/api'
import { useMemo } from 'react'
import type { AddressGroup } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'

export type PortfolioBalancesResult = GqlResult<Record<Address, PortfolioBalance> | undefined>

export function usePortfolioBalancesForAddressById(addresses: AddressGroup): PortfolioBalancesResult {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalances({
    ...addresses,
    fetchPolicy: 'cache-first', // we want to avoid re-renders when token selector is opening
  })

  return useMemo(
    () => ({
      data: portfolioBalancesById,
      error,
      refetch,
      loading,
    }),
    [portfolioBalancesById, error, refetch, loading],
  )
}

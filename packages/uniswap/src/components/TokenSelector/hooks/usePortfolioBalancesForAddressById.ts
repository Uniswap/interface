import { useMemo } from 'react'
import { GqlResult } from 'uniswap/src/data/types'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export function usePortfolioBalancesForAddressById({
  evmAddress,
  svmAddress,
}: {
  evmAddress: Address | undefined
  svmAddress?: Address | undefined
}): GqlResult<Record<Address, PortfolioBalance> | undefined> {
  const {
    data: portfolioBalancesById,
    error,
    refetch,
    loading,
  } = usePortfolioBalances({
    evmAddress,
    svmAddress,
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

import { WatchQueryFetchPolicy } from '@apollo/client'
import { useMemo } from 'react'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { CurrencyId } from 'uniswap/src/types/currency'

export function useBalances({
  evmAddress,
  svmAddress,
  currencies,
  fetchPolicy = 'cache-and-network',
}: {
  evmAddress?: Address
  svmAddress?: Address
  currencies: CurrencyId[] | undefined
  fetchPolicy?: WatchQueryFetchPolicy
}): PortfolioBalance[] | null {
  const { data: balances } = usePortfolioBalances({
    evmAddress,
    svmAddress,
    fetchPolicy,
  })

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) {
      return null
    }

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

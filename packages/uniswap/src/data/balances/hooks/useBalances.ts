import { WatchQueryFetchPolicy } from '@apollo/client'
import { useMemo } from 'react'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'

export function useBalances({
  address,
  currencies,
  fetchPolicy = 'cache-and-network',
}: {
  address: Address
  currencies: CurrencyId[] | undefined
  fetchPolicy?: WatchQueryFetchPolicy
}): PortfolioBalance[] | null {
  const { data: balances } = usePortfolioBalances({
    address,
    fetchPolicy,
  })

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) {
      return null
    }

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

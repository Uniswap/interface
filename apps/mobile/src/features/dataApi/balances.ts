import { useMemo } from 'react'
import { usePortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useBalances(currencies: CurrencyId[] | undefined): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances({
    address,
    fetchPolicy: 'cache-and-network',
  })

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) {
      return null
    }

    return currencies.map((id: CurrencyId) => balances[id] ?? null).filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

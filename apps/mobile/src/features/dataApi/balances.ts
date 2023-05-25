import { useMemo } from 'react'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

/** Helper hook to retrieve balance for a single currency for the active account. */
export function useSingleBalance(_currencyId: CurrencyId): PortfolioBalance | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: portfolioBalances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!portfolioBalances) return null
    return portfolioBalances[_currencyId] ?? null
  }, [portfolioBalances, _currencyId])
}

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useMultipleBalances(
  currencies: CurrencyId[] | undefined
): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies
      .map((id: CurrencyId) => balances[id] ?? null)
      .filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

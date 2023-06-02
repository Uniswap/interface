import { useMemo } from 'react'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'
import { usePortfolioBalances } from 'wallet/src/features/dataApi/balances'
import { PortfolioBalance } from 'wallet/src/features/dataApi/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

/** Helper hook to retrieve balances for a set of currencies for the active account. */
export function useBalances(currencies: CurrencyId[] | undefined): PortfolioBalance[] | null {
  const address = useActiveAccountAddressWithThrow()
  const { data: balances } = usePortfolioBalances(address, /*shouldPoll=*/ false)

  return useMemo(() => {
    if (!currencies || !currencies.length || !balances) return null

    return currencies
      .map((id: CurrencyId) => balances[id] ?? null)
      .filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

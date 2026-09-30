import { useMemo } from 'react'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { CurrencyId } from 'uniswap/src/types/currency'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { FetchPolicy } from 'uniswap/src/utils/usePlatformBasedFetchPolicy'

export function useBalances({
  evmAddress,
  svmAddress,
  currencies,
  fetchPolicy = 'cache-and-network',
}: {
  evmAddress?: Address
  svmAddress?: Address
  currencies: CurrencyId[] | undefined
  fetchPolicy?: FetchPolicy
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

    // Balance ids are lowercased by buildCurrency, but callers may pass checksummed ids
    // (e.g. GetTokenMultiChain deployments), so retry the lookup with a normalized id.
    return currencies
      .map((id: CurrencyId) => balances[id] ?? balances[normalizeCurrencyIdForMapLookup(id)] ?? null)
      .filter((x): x is PortfolioBalance => Boolean(x))
  }, [balances, currencies])
}

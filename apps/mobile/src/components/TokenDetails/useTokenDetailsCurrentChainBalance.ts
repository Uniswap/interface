import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useBalances } from 'uniswap/src/data/balances/hooks/useBalances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function useTokenDetailsCurrentChainBalance(): PortfolioBalance | null {
  const activeAddress = useActiveAccountAddressWithThrow()
  const { currencyId } = useTokenDetailsContext()

  return (
    useBalances({
      evmAddress: activeAddress,
      currencies: [currencyId],
      // There are already other requests in the TDP that will update the cache,
      // so no need to do additional network requests when using this helper hook.
      fetchPolicy: 'cache-first',
    })?.[0] ?? null
  )
}

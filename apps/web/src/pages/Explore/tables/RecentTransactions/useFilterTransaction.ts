import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { normalizeTextInput } from 'utilities/src/primitives/string'
import { useExploreTablesFilterStore } from '~/pages/Explore/exploreTablesFilterStore'

// Filters transactions in Explore by hash, token symbol, or token address
export function useFilteredTransactions(transactions: GraphQLApi.PoolTxFragment[]) {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const lowercaseFilterString = useMemo(() => normalizeTextInput(filterString, true), [filterString])

  return useMemo(
    () =>
      transactions.filter((tx) => {
        const hashIncludesFilterString = normalizeTextInput(tx.hash, true).includes(lowercaseFilterString)
        const token0IncludesFilterString = tx.token0.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token1IncludesFilterString = tx.token1.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token0HashIncludesFilterString =
          tx.token0.address && normalizeTokenAddressForCache(tx.token0.address).includes(lowercaseFilterString)
        const token1HashIncludesFilterString =
          tx.token1.address && normalizeTokenAddressForCache(tx.token1.address).includes(lowercaseFilterString)
        const token0AddressIncludesFilterString =
          tx.token0.address && normalizeTokenAddressForCache(tx.token0.address).includes(lowercaseFilterString)
        const token1AddressIncludesFilterString =
          tx.token1.address && normalizeTokenAddressForCache(tx.token1.address).includes(lowercaseFilterString)
        return (
          hashIncludesFilterString ||
          token0IncludesFilterString ||
          token1IncludesFilterString ||
          token0HashIncludesFilterString ||
          token1HashIncludesFilterString ||
          token0AddressIncludesFilterString ||
          token1AddressIncludesFilterString
        )
      }),
    [lowercaseFilterString, transactions],
  )
}

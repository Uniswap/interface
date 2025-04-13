import { exploreSearchStringAtom } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { PoolTxFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// Filters transactions in Explore by hash, token symbol, or token address
export function useFilteredTransactions(transactions: PoolTxFragment[]) {
  const filterString = useAtomValue(exploreSearchStringAtom)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      transactions?.filter((tx) => {
        const hashIncludesFilterString = tx.hash.toLowerCase().includes(lowercaseFilterString)
        const token0IncludesFilterString = tx.token0?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token1IncludesFilterString = tx.token1?.symbol?.toLowerCase().includes(lowercaseFilterString)
        const token0HashIncludesFilterString = tx.token0?.address?.toLowerCase().includes(lowercaseFilterString)
        const token1HashIncludesFilterString = tx.token1?.address?.toLowerCase().includes(lowercaseFilterString)
        const token0AddressIncludesFilterString = tx.token0?.address?.toLowerCase().includes(lowercaseFilterString)
        const token1AddressIncludesFilterString = tx.token1?.address?.toLowerCase().includes(lowercaseFilterString)
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

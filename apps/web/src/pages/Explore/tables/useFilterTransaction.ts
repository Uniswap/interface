import { unwrapFewToken } from 'appGraphql/data/util'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { useDefaultRingActiveTokens } from 'state/lists/hooks'
import { PoolTransaction } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { PoolTxFragment } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainInfo } from 'uniswap/src/features/chains/types'

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

type RingTransactionWithLogos = PoolTransaction & {
  token0logo?: string
  token1logo?: string
}

// Filters transactions in Explore by hash, token symbol, or token address
export function useFilteredRingTransactions(
  transactions: PoolTransaction[],
  chainInfo: UniverseChainInfo,
): RingTransactionWithLogos[] {
  const filterString = useAtomValue(exploreSearchStringAtom)
  const ringTokens = useDefaultRingActiveTokens(chainInfo.id)

  const lowercaseFilterString = useMemo(() => filterString.toLowerCase(), [filterString])

  return useMemo(
    () =>
      transactions
        ?.filter((tx) => {
          const hashIncludesFilterString = tx.hash.toLowerCase().includes(lowercaseFilterString)
          const token0IncludesFilterString = tx.token0?.originToken?.symbol
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          const token1IncludesFilterString = tx.token1?.originToken?.symbol
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          const token0HashIncludesFilterString = tx.token0?.originToken?.address
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          const token1HashIncludesFilterString = tx.token1?.originToken?.address
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          const token0AddressIncludesFilterString = tx.token0?.originToken?.address
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          const token1AddressIncludesFilterString = tx.token1?.originToken?.address
            ?.toLowerCase()
            .includes(lowercaseFilterString)
          return (
            hashIncludesFilterString ||
            token0IncludesFilterString ||
            token1IncludesFilterString ||
            token0HashIncludesFilterString ||
            token1HashIncludesFilterString ||
            token0AddressIncludesFilterString ||
            token1AddressIncludesFilterString
          )
        })
        .map((item) => {
          const token0IsBeingSold = parseFloat(item.token0Quantity) < 0
          const token0logo = Object.values(ringTokens).find(
            (i) => i.address.toLowerCase() === item.token0?.originToken?.address?.toLowerCase(),
          ) as any
          const token1logo = Object.values(ringTokens).find(
            (i) => i.address.toLowerCase() === item.token1?.originToken?.address?.toLowerCase(),
          ) as any
          const token0 = unwrapFewToken(chainInfo.id, item.token0, token0logo?.logoURI)
          const token1 = unwrapFewToken(chainInfo.id, item.token1, token1logo?.logoURI)
          const token0Quantity = item.token0Quantity
          const token1Quantity = item.token1Quantity
          return {
            ...item,
            token0: token0IsBeingSold ? token0 : token1,
            token1: token0IsBeingSold ? token1 : token0,
            token0logo: token0IsBeingSold ? token0logo?.logoURI : token1logo?.logoURI,
            token1logo: token0IsBeingSold ? token1logo?.logoURI : token0logo?.logoURI,
            token0Quantity: token0IsBeingSold ? token0Quantity : token1Quantity,
            token1Quantity: token0IsBeingSold ? token1Quantity : token0Quantity,
          }
        }),
    [lowercaseFilterString, transactions, ringTokens, chainInfo],
  )
}

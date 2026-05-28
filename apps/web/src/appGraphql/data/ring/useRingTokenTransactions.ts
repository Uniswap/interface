import { useRingTokenTransactionsQuery } from 'appGraphql/data/ring/useRingTokenTransactionsQuery'
import { TokenTransactionType } from 'appGraphql/data/useTokenTransactions'
import { useCallback, useMemo, useRef } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

const TokenTransactionDefaultQuerySize = 25

export function useRingTokenTransactions(
  address: string,
  chainId: UniverseChainId,
  filter: TokenTransactionType[] = [TokenTransactionType.BUY, TokenTransactionType.SELL],
) {
  const { data, loading, error, fetchMore } = useRingTokenTransactionsQuery({
    address: address.toLowerCase(),
    filter,
    chain: toGraphQLChain(chainId),
  })
  const loadingMore = useRef(false)
  const querySizeRef = useRef(TokenTransactionDefaultQuerySize)
  const pageInfo = useMemo(() => data?.poolTransactions?.pageInfo, [data?.poolTransactions])
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true
      const after = pageInfo?.endCursor
      querySizeRef.current += TokenTransactionDefaultQuerySize
      fetchMore({
        variables: {
          ...(after ? { after } : {}),
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            loadingMore.current = false
            return prev
          }
          onComplete?.()
          const mergedData = {
            token: fetchMoreResult.token,
            poolTransactions: {
              ...fetchMoreResult.poolTransactions,
              items: [...prev.poolTransactions.items, ...fetchMoreResult.poolTransactions.items],
            },
          }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [pageInfo, fetchMore],
  )

  return useMemo(
    () => ({
      transactions: data?.poolTransactions?.items ?? [],
      referenceToken: data?.token,
      loading,
      error,
      pageInfo: data?.poolTransactions?.pageInfo,
      loadMore,
    }),
    [data, loading, error, loadMore],
  )
}

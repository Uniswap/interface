import { ApolloError } from '@apollo/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { getListTransactionsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible'
import { uniswapTransactionToPoolTx } from '~/appGraphql/data/v2/uniswapTransactionAdapters'
import {
  BETypeToTransactionType,
  TransactionType,
  useAllTransactionsLegacy,
  type UseAllTransactionsResult,
} from '~/data/useAllTransactions'
import { useInfiniteLoadMore } from '~/features/Explore/state/hooks/useInfiniteLoadMore'

export function useAllTransactions(
  chain: GraphQLApi.Chain,
  filter: TransactionType[] = [TransactionType.SWAP, TransactionType.ADD, TransactionType.REMOVE],
): UseAllTransactionsResult {
  const chainId = fromGraphQLChain(chain)
  const v2Enabled =
    useFeatureFlag(FeatureFlags.V2EndpointsTransactions) && chainId !== null && chainId !== UniverseChainId.Solana

  const legacy = useAllTransactionsLegacy({ chain, filter, skip: v2Enabled })
  const v2 = useAllTransactionsV2({ chainId: chainId ?? UniverseChainId.Mainnet, filter, enabled: v2Enabled })

  return v2Enabled ? v2 : legacy
}

function useAllTransactionsV2({
  chainId,
  filter,
  enabled,
}: {
  chainId: UniverseChainId
  filter: TransactionType[]
  enabled: boolean
}): UseAllTransactionsResult {
  // Parity with the legacy path: pause fetching while the browser tab is backgrounded.
  const isWindowVisible = useIsWindowVisible()

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getListTransactionsQueryOptions({ chainIds: [chainId], enabled: enabled && isWindowVisible }),
  )

  const adaptedTransactions = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.transactions)
        .map((tx, index) => uniswapTransactionToPoolTx(tx, index))
        .filter((tx): tx is GraphQLApi.PoolTxFragment => tx !== undefined),
    [data?.pages],
  )

  // Type filter stays client-side (like legacy): pushing it into the request would change the
  // query key on every toggle, dropping all loaded pages.
  const filteredTransactions = useMemo(
    () => adaptedTransactions.filter((tx) => filter.includes(BETypeToTransactionType[tx.type])),
    [adaptedTransactions, filter],
  )

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: adaptedTransactions.length,
  })

  // The table's error/skeleton logic keys off errorV2 && errorV3; surface the single v2 error as both.
  const wrappedError = useMemo(() => (error ? new ApolloError({ errorMessage: error.message }) : undefined), [error])

  return {
    transactions: filteredTransactions,
    // !isWindowVisible mirrors legacy: keep the loading state while backgrounded so the empty feed doesn't flash.
    loading: isLoading || !isWindowVisible,
    errorV2: wrappedError,
    errorV3: wrappedError,
    errorV4: wrappedError,
    loadMore,
  }
}

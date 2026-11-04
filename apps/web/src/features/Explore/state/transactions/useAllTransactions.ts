import { useInfiniteQuery } from '@tanstack/react-query'
import { TransactionEventType } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import { getListTransactionsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { useIsWindowVisible } from 'utilities/src/react/useIsWindowVisible'
import {
  parseUniswapTransaction,
  type PoolTransaction,
  type PoolTransactionEventType,
} from '~/data/transactions/poolTransaction'
import { useInfiniteLoadMore } from '~/features/Explore/hooks/useInfiniteLoadMore'

export enum TransactionType {
  SWAP = 'Swap',
  ADD = 'Add',
  REMOVE = 'Remove',
}

export const BETypeToTransactionType: Record<PoolTransactionEventType, TransactionType> = {
  [TransactionEventType.SWAP]: TransactionType.SWAP,
  [TransactionEventType.REMOVE]: TransactionType.REMOVE,
  [TransactionEventType.ADD]: TransactionType.ADD,
}

interface UseAllTransactionsResult {
  transactions: PoolTransaction[]
  loading: boolean
  error: Error | null
  loadMore: ({ onComplete }: { onComplete?: () => void }) => void
}

export function useAllTransactions(
  chainId: UniverseChainId,
  filter: TransactionType[] = [TransactionType.SWAP, TransactionType.ADD, TransactionType.REMOVE],
): UseAllTransactionsResult {
  const isWindowVisible = useIsWindowVisible()

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getListTransactionsQueryOptions({ chainIds: [chainId], enabled: isWindowVisible }),
  )

  const parsedTransactions = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.transactions)
        .map((tx, index) => parseUniswapTransaction(tx, index))
        .filter((tx): tx is PoolTransaction => tx !== undefined),
    [data?.pages],
  )

  // Type filter client-side pushing it into the request would change
  // the query key on every toggle, dropping all loaded pages.
  const filteredTransactions = useMemo(
    () => parsedTransactions.filter((tx) => filter.includes(BETypeToTransactionType[tx.eventType])),
    [parsedTransactions, filter],
  )

  const loadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  })

  return {
    transactions: filteredTransactions,
    loading: isLoading || !isWindowVisible,
    error,
    loadMore,
  }
}

/* eslint-disable import/no-unused-modules */
import { useRingTransactionsQuery } from 'appGraphql/data/ring/useRingTransactions'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useCallback, useMemo, useRef } from 'react'
import { PoolTransaction } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import {
  Chain,
  PoolTransactionType,
  PoolTxFragment,
  useV2TransactionsQuery,
  useV3TransactionsQuery,
  useV4TransactionsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export enum TransactionType {
  SWAP = 'Swap',
  ADD = 'Add',
  REMOVE = 'Remove',
}

export const BETypeToTransactionType: { [key: string]: TransactionType } = {
  [PoolTransactionType.Swap]: TransactionType.SWAP,
  [PoolTransactionType.Remove]: TransactionType.REMOVE,
  [PoolTransactionType.Add]: TransactionType.ADD,
}

export const BETypeToPoolTransactionType: { [key: string]: PoolTransactionType } = {
  [TransactionType.SWAP]: PoolTransactionType.Swap,
  [TransactionType.REMOVE]: PoolTransactionType.Remove,
  [TransactionType.ADD]: PoolTransactionType.Add,
}

const ALL_TX_DEFAULT_QUERY_SIZE = 20

export function useAllTransactions(
  chain: Chain,
  filter: TransactionType[] = [TransactionType.SWAP, TransactionType.ADD, TransactionType.REMOVE],
) {
  const isWindowVisible = useIsWindowVisible()

  const {
    data: dataV4,
    loading: loadingV4,
    error: errorV4,
    fetchMore: fetchMoreV4,
  } = useV4TransactionsQuery({
    variables: { chain, first: ALL_TX_DEFAULT_QUERY_SIZE },
    skip: !isWindowVisible,
  })
  const {
    data: dataV3,
    loading: loadingV3,
    error: errorV3,
    fetchMore: fetchMoreV3,
  } = useV3TransactionsQuery({
    variables: { chain, first: ALL_TX_DEFAULT_QUERY_SIZE },
    skip: !isWindowVisible,
  })
  const {
    data: dataV2,
    loading: loadingV2,
    error: errorV2,
    fetchMore: fetchMoreV2,
  } = useV2TransactionsQuery({
    variables: { chain, first: ALL_TX_DEFAULT_QUERY_SIZE },
    skip: !isWindowVisible,
  })

  const loadingMoreV4 = useRef(false)
  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const querySizeRef = useRef(ALL_TX_DEFAULT_QUERY_SIZE)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMoreV4.current || loadingMoreV3.current || loadingMoreV2.current) {
        return
      }
      loadingMoreV4.current = true
      loadingMoreV3.current = true
      loadingMoreV2.current = true
      querySizeRef.current += ALL_TX_DEFAULT_QUERY_SIZE

      fetchMoreV4({
        variables: {
          cursor: dataV4?.v4Transactions?.[dataV4.v4Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            loadingMoreV4.current = false
            return prev
          }
          if (!loadingMoreV3.current && !loadingMoreV2.current) {
            onComplete?.()
          }
          const mergedData = {
            v4Transactions: [...(prev.v4Transactions ?? []), ...(fetchMoreResult.v4Transactions ?? [])],
          }
          loadingMoreV4.current = false
          return mergedData
        },
      })

      fetchMoreV3({
        variables: {
          cursor: dataV3?.v3Transactions?.[dataV3.v3Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            loadingMoreV3.current = false
            return prev
          }
          if (!loadingMoreV2.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            v3Transactions: [...(prev.v3Transactions ?? []), ...(fetchMoreResult.v3Transactions ?? [])],
          }
          loadingMoreV3.current = false
          return mergedData
        },
      })

      fetchMoreV2({
        variables: {
          cursor: dataV2?.v2Transactions?.[dataV2.v2Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            loadingMoreV2.current = false
            return prev
          }
          if (!loadingMoreV3.current && !loadingMoreV4.current) {
            onComplete?.()
          }
          const mergedData = {
            v2Transactions: [...(prev.v2Transactions ?? []), ...(fetchMoreResult.v2Transactions ?? [])],
          }
          loadingMoreV2.current = false
          return mergedData
        },
      })
    },
    [dataV2?.v2Transactions, dataV3?.v3Transactions, dataV4?.v4Transactions, fetchMoreV2, fetchMoreV3, fetchMoreV4],
  )

  const filterTransaction = useCallback(
    (tx: PoolTxFragment | undefined): tx is PoolTxFragment => {
      return !!tx?.type && filter.includes(BETypeToTransactionType[tx.type])
    },
    [filter],
  )

  const transactions: PoolTxFragment[] = useMemo(() => {
    return [...(dataV4?.v4Transactions ?? []), ...(dataV3?.v3Transactions ?? []), ...(dataV2?.v2Transactions ?? [])]
      .filter(filterTransaction)
      .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
      .slice(0, querySizeRef.current)
  }, [dataV2?.v2Transactions, dataV3?.v3Transactions, dataV4?.v4Transactions, filterTransaction])

  return {
    transactions,
    // useIsWindowVisible briefly initializes as false, which skips the GQL transaction query, so the "no data found" state initially flashes
    loading: loadingV2 || loadingV3 || loadingV4 || !isWindowVisible,
    errorV2,
    errorV3,
    errorV4,
    loadMore,
  }
}

export function useAllRingTransactions(
  chain: Chain,
  filter: PoolTransactionType[] = [PoolTransactionType.Swap, PoolTransactionType.Add, PoolTransactionType.Remove],
) {
  const isWindowVisible = useIsWindowVisible()

  const typeFilter = filter.map((t) => ({ type: t }))

  const { data, loading, error, fetchMore } = useRingTransactionsQuery({
    chain,
    type: typeFilter,
    limit: ALL_TX_DEFAULT_QUERY_SIZE,
    skip: !isWindowVisible,
  })

  const loadingMore = useRef(false)
  const pageInfo = useMemo(() => data?.poolTransactions?.pageInfo, [data?.poolTransactions])
  const querySizeRef = useRef(ALL_TX_DEFAULT_QUERY_SIZE)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true
      const after = pageInfo?.endCursor
      querySizeRef.current += ALL_TX_DEFAULT_QUERY_SIZE

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
    [pageInfo?.endCursor, fetchMore],
  )

  const filterTransaction = useCallback(
    (tx: PoolTransaction | undefined): tx is PoolTransaction => {
      return !!tx?.type && filter.includes(tx.type as PoolTransactionType)
    },
    [filter],
  )

  const transactions: PoolTransaction[] = useMemo(() => {
    return [...(data?.poolTransactions?.items ?? [])]
      .filter(filterTransaction)
      .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
      .slice(0, querySizeRef.current)
  }, [data?.poolTransactions, filterTransaction])

  return {
    transactions,
    // useIsWindowVisible briefly initializes as false, which skips the GQL transaction query, so the "no data found" state initially flashes
    loading: loading || !isWindowVisible,
    error,
    loadMore,
  }
}

import {
  Chain,
  PoolTransaction,
  PoolTransactionType,
  useV2TransactionsQuery,
  useV3TransactionsQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { useCallback, useMemo, useRef } from 'react'

export enum TransactionType {
  SWAP = 'Swap',
  MINT = 'Add',
  BURN = 'Remove',
}

export const BETypeToTransactionType: { [key: string]: TransactionType } = {
  [PoolTransactionType.Swap]: TransactionType.SWAP,
  [PoolTransactionType.Remove]: TransactionType.BURN,
  [PoolTransactionType.Add]: TransactionType.MINT,
}

const ALL_TX_DEFAULT_QUERY_SIZE = 20

export function useAllTransactions(
  chain: Chain,
  filter: TransactionType[] = [TransactionType.SWAP, TransactionType.MINT, TransactionType.BURN]
) {
  const {
    data: dataV3,
    loading: loadingV3,
    error: errorV3,
    fetchMore: fetchMoreV3,
  } = useV3TransactionsQuery({
    variables: { chain, first: ALL_TX_DEFAULT_QUERY_SIZE },
  })
  const {
    data: dataV2,
    loading: loadingV2,
    error: errorV2,
    fetchMore: fetchMoreV2,
  } = useV2TransactionsQuery({
    variables: { first: ALL_TX_DEFAULT_QUERY_SIZE },
    skip: chain !== Chain.Ethereum,
  })

  const loadingMoreV3 = useRef(false)
  const loadingMoreV2 = useRef(false)
  const querySizeRef = useRef(ALL_TX_DEFAULT_QUERY_SIZE)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMoreV3.current || (loadingMoreV2.current && chain === Chain.Ethereum)) {
        return
      }
      loadingMoreV3.current = true
      loadingMoreV2.current = true
      querySizeRef.current += ALL_TX_DEFAULT_QUERY_SIZE
      fetchMoreV3({
        variables: {
          cursor: dataV3?.v3Transactions?.[dataV3.v3Transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          if (!loadingMoreV2.current || chain !== Chain.Ethereum) onComplete?.()
          const mergedData = {
            v3Transactions: [...(prev.v3Transactions ?? []), ...(fetchMoreResult.v3Transactions ?? [])],
          }
          loadingMoreV3.current = false
          return mergedData
        },
      })
      chain === Chain.Ethereum &&
        fetchMoreV2({
          variables: {
            cursor: dataV2?.v2Transactions?.[dataV2.v2Transactions.length - 1]?.timestamp,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev
            !loadingMoreV3.current && onComplete?.()
            const mergedData = {
              v2Transactions: [...(prev.v2Transactions ?? []), ...(fetchMoreResult.v2Transactions ?? [])],
            }
            loadingMoreV2.current = false
            return mergedData
          },
        })
    },
    [chain, dataV2?.v2Transactions, dataV3?.v3Transactions, fetchMoreV2, fetchMoreV3]
  )

  const transactions: PoolTransaction[] = useMemo(() => {
    const v3Transactions =
      dataV3?.v3Transactions?.filter((tx) => tx.type && filter.includes(BETypeToTransactionType[tx.type])) ?? []
    const v2Transactions =
      dataV2?.v2Transactions?.filter((tx) => tx.type && filter.includes(BETypeToTransactionType[tx.type])) ?? []
    return [...v3Transactions, ...v2Transactions]
      .sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
      .slice(0, querySizeRef.current)
  }, [dataV2?.v2Transactions, dataV3?.v3Transactions, filter])

  return {
    transactions,
    loading: loadingV2 || loadingV3,
    error: errorV2 || errorV3,
    loadMore,
  }
}

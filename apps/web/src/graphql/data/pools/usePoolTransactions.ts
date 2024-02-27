import { ChainId } from '@uniswap/sdk-core'
import {
  PoolTransactionType,
  ProtocolVersion,
  Token,
  V2PairTransactionsQuery,
  V3PoolTransactionsQuery,
  useV2PairTransactionsQuery,
  useV3PoolTransactionsQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { chainIdToBackendName } from 'graphql/data/util'
import { useCallback, useMemo, useRef } from 'react'

export enum PoolTableTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  BURN = 'Burn',
  MINT = 'Mint',
}

export interface PoolTableTransaction {
  timestamp: number
  transaction: string
  pool: {
    token0: {
      id: string
      symbol: string
    }
    token1: {
      id: string
      symbol: string
    }
  }
  maker: string
  amount0: number
  amount1: number
  amountUSD: number
  type: PoolTableTransactionType
}

const PoolTransactionDefaultQuerySize = 25

export function usePoolTransactions(
  address: string,
  chainId?: ChainId,
  // sortState: PoolTxTableSortState, TODO(WEB-3706): Implement sorting when BE supports
  filter: PoolTableTransactionType[] = [
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.BURN,
    PoolTableTransactionType.MINT,
  ],
  token0?: Token,
  protocolVersion: ProtocolVersion = ProtocolVersion.V3,
  first = PoolTransactionDefaultQuerySize
) {
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
    fetchMore: fetchMoreV3,
  } = useV3PoolTransactionsQuery({
    variables: { first, chain: chainIdToBackendName(chainId), address },
    skip: protocolVersion !== ProtocolVersion.V3,
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = useV2PairTransactionsQuery({
    variables: { first, address },
    skip: protocolVersion !== ProtocolVersion.V2 || chainId !== ChainId.MAINNET,
  })
  const loadingMore = useRef(false)
  const { transactions, loading, fetchMore, error } =
    protocolVersion === ProtocolVersion.V3
      ? { transactions: dataV3?.v3Pool?.transactions, loading: loadingV3, fetchMore: fetchMoreV3, error: errorV3 }
      : { transactions: dataV2?.v2Pair?.transactions, loading: loadingV2, fetchMore: fetchMoreV2, error: errorV2 }

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true
      fetchMore({
        variables: {
          cursor: transactions?.[transactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) return prev
          onComplete?.()
          const mergedData =
            protocolVersion === ProtocolVersion.V3
              ? {
                  v3Pool: {
                    ...fetchMoreResult.v3Pool,
                    transactions: [
                      ...((prev as V3PoolTransactionsQuery).v3Pool?.transactions ?? []),
                      ...fetchMoreResult.v3Pool.transactions,
                    ],
                  },
                }
              : {
                  v2Pair: {
                    ...fetchMoreResult.v2Pair,
                    transactions: [
                      ...((prev as V2PairTransactionsQuery).v2Pair?.transactions ?? []),
                      ...fetchMoreResult.v2Pair.transactions,
                    ],
                  },
                }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [fetchMore, transactions, protocolVersion]
  )

  const filteredTransactions = useMemo(() => {
    return (transactions ?? [])
      ?.map((tx) => {
        const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
        const isSell = tokenIn?.address?.toLowerCase() === token0?.address?.toLowerCase()
        const type =
          tx.type === PoolTransactionType.Swap
            ? isSell
              ? PoolTableTransactionType.SELL
              : PoolTableTransactionType.BUY
            : tx.type === PoolTransactionType.Remove
            ? PoolTableTransactionType.BURN
            : PoolTableTransactionType.MINT
        if (!filter.includes(type)) return undefined
        return {
          timestamp: tx.timestamp,
          transaction: tx.hash,
          pool: {
            token0: {
              id: tx.token0.address ?? '',
              symbol: tx.token0.symbol ?? '',
            },
            token1: {
              id: tx.token1.address ?? '',
              symbol: tx.token1.symbol ?? '',
            },
          },
          maker: tx.account,
          amount0: parseFloat(tx.token0Quantity),
          amount1: parseFloat(tx.token1Quantity),
          amountUSD: tx.usdValue.value,
          type,
        }
      })
      .filter((value: PoolTableTransaction | undefined): value is PoolTableTransaction => value !== undefined)
  }, [transactions, filter, token0?.address])

  return useMemo(() => {
    return {
      transactions: filteredTransactions,
      loading,
      loadMore,
      error,
    }
  }, [filteredTransactions, loading, loadMore, error])
}

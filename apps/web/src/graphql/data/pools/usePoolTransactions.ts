import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCallback, useMemo, useRef } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import {
  PoolTransactionType,
  ProtocolVersion,
  Token,
  V2PairTransactionsQuery,
  V3PoolTransactionsQuery,
  V4PoolTransactionsQuery,
  useV2PairTransactionsQuery,
  useV3PoolTransactionsQuery,
  useV4PoolTransactionsQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export enum PoolTableTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  REMOVE = 'Remove',
  ADD = 'Add',
}

export interface PoolTableTransaction {
  timestamp: number
  transaction: string
  pool: {
    token0: {
      id: string | null
      symbol: string
    }
    token1: {
      id: string | null
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
  chainId?: UniverseChainId,
  // sortState: PoolTxTableSortState, TODO(WEB-3706): Implement sorting when BE supports
  filter: PoolTableTransactionType[] = [
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.REMOVE,
    PoolTableTransactionType.ADD,
  ],
  token0?: Token,
  protocolVersion: ProtocolVersion = ProtocolVersion.V3,
  first = PoolTransactionDefaultQuerySize,
) {
  const { defaultChainId } = useEnabledChains()
  const variables = { first, chain: toGraphQLChain(chainId ?? defaultChainId) }
  const v4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
    fetchMore: fetchMoreV4,
  } = useV4PoolTransactionsQuery({
    variables: {
      ...variables,
      poolId: address,
    },
    skip: !v4DataEnabled || protocolVersion !== ProtocolVersion.V4,
  })
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
    fetchMore: fetchMoreV3,
  } = useV3PoolTransactionsQuery({
    variables: {
      ...variables,
      address,
    },
    skip: protocolVersion !== ProtocolVersion.V3,
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = useV2PairTransactionsQuery({
    variables: {
      ...variables,
      address,
    },
    skip: !chainId || protocolVersion !== ProtocolVersion.V2,
  })
  const loadingMore = useRef(false)
  const { transactions, loading, fetchMore, error } =
    protocolVersion === ProtocolVersion.V4
      ? { transactions: dataV4?.v4Pool?.transactions, loading: loadingV4, fetchMore: fetchMoreV4, error: errorV4 }
      : protocolVersion === ProtocolVersion.V3
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
          if (!fetchMoreResult) {
            loadingMore.current = false
            return prev
          }
          onComplete?.()
          const mergedData =
            protocolVersion === ProtocolVersion.V4
              ? {
                  v4Pool: {
                    ...fetchMoreResult.v4Pool,
                    transactions: [
                      ...((prev as V4PoolTransactionsQuery).v4Pool?.transactions ?? []),
                      ...fetchMoreResult.v4Pool.transactions,
                    ],
                  },
                }
              : protocolVersion === ProtocolVersion.V3
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
    [fetchMore, transactions, protocolVersion],
  )

  const filteredTransactions = useMemo(() => {
    return (transactions ?? [])
      ?.map((tx) => {
        if (!tx) {
          return undefined
        }
        const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
        const token0Address =
          token0?.address === NATIVE_CHAIN_ID
            ? WRAPPED_NATIVE_CURRENCY[chainId ?? UniverseChainId.Mainnet]?.address
            : token0?.address
        const isSell = tokenIn?.address?.toLowerCase() === token0Address?.toLowerCase()
        const type =
          tx.type === PoolTransactionType.Swap
            ? isSell
              ? PoolTableTransactionType.SELL
              : PoolTableTransactionType.BUY
            : tx.type === PoolTransactionType.Remove
              ? PoolTableTransactionType.REMOVE
              : PoolTableTransactionType.ADD
        if (!filter.includes(type)) {
          return undefined
        }
        return {
          timestamp: tx.timestamp,
          transaction: tx.hash,
          pool: {
            token0: {
              id: tx.token0.address ?? null,
              symbol: tx.token0.symbol ?? '',
            },
            token1: {
              id: tx.token1.address ?? null,
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
  }, [transactions, token0?.address, chainId, filter])

  return useMemo(() => {
    return {
      transactions: filteredTransactions,
      loading,
      loadMore,
      error,
    }
  }, [filteredTransactions, loading, loadMore, error])
}

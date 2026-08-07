import { useInfiniteQuery } from '@tanstack/react-query'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useRef } from 'react'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getListTransactionsQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/transactions/queries'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import i18n from 'uniswap/src/i18n'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import {
  connectErrorToApolloError,
  gqlProtocolVersionToRestProtocolVersion,
  uniswapTransactionToPoolTx,
} from '~/appGraphql/data/v2/uniswapTransactionAdapters'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useInfiniteLoadMore } from '~/features/Explore/state/hooks/useInfiniteLoadMore'

export enum PoolTableTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  REMOVE = 'Remove',
  ADD = 'Add',
}

export const getPoolTableTransactionTypeTranslation = (type: PoolTableTransactionType): string => {
  switch (type) {
    case PoolTableTransactionType.BUY:
      return i18n.t('common.buy.label')
    case PoolTableTransactionType.SELL:
      return i18n.t('common.sell.label')
    case PoolTableTransactionType.REMOVE:
      return i18n.t('common.remove.label')
    case PoolTableTransactionType.ADD:
      return i18n.t('common.add.label')
    default:
      return ''
  }
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

export function usePoolTransactions({
  address,
  chainId,
  filter = [
    PoolTableTransactionType.BUY,
    PoolTableTransactionType.SELL,
    PoolTableTransactionType.REMOVE,
    PoolTableTransactionType.ADD,
  ],
  token0,
  protocolVersion,
  first = PoolTransactionDefaultQuerySize,
}: {
  address: string
  chainId?: UniverseChainId
  // sortState: PoolTxTableSortState, TODO(WEB-3706): Implement sorting when BE supports
  filter?: PoolTableTransactionType[]
  token0?: GraphQLApi.Token
  protocolVersion?: GraphQLApi.ProtocolVersion
  first?: number
}) {
  const { defaultChainId } = useEnabledChains()
  const variables = { first, chain: toGraphQLChain(chainId ?? defaultChainId) }
  const isSolanaChain = chainId && isSVMChain(chainId)

  const restProtocolVersion = protocolVersion ? gqlProtocolVersionToRestProtocolVersion(protocolVersion) : undefined
  const v2Enabled =
    useFeatureFlag(FeatureFlags.V2EndpointsTransactions) && !isSolanaChain && restProtocolVersion !== undefined

  const {
    data: v2Data,
    isLoading: v2Loading,
    error: v2Error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    getListTransactionsQueryOptions({
      chainIds: [chainId ?? defaultChainId],
      tokenScope: { case: 'poolId', value: address },
      protocolVersions: restProtocolVersion ? [restProtocolVersion] : undefined,
      pageSize: first,
      enabled: v2Enabled,
    }),
  )

  const v2Transactions = useMemo(
    () =>
      (v2Data?.pages ?? [])
        .flatMap((page) => page.transactions)
        .map((tx, index) => uniswapTransactionToPoolTx(tx, index))
        .filter((tx): tx is GraphQLApi.PoolTxFragment => tx !== undefined),
    [v2Data?.pages],
  )

  const v2LoadMore = useInfiniteLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    dataLength: v2Transactions.length,
  })

  const {
    loading: loadingV4,
    error: errorV4,
    data: dataV4,
    fetchMore: fetchMoreV4,
  } = GraphQLApi.useV4PoolTransactionsQuery({
    variables: {
      ...variables,
      poolId: address,
    },
    skip: protocolVersion !== GraphQLApi.ProtocolVersion.V4 || isSolanaChain || v2Enabled,
  })
  const {
    loading: loadingV3,
    error: errorV3,
    data: dataV3,
    fetchMore: fetchMoreV3,
  } = GraphQLApi.useV3PoolTransactionsQuery({
    variables: {
      ...variables,
      address,
    },
    skip: protocolVersion !== GraphQLApi.ProtocolVersion.V3 || isSolanaChain || v2Enabled,
  })
  const {
    loading: loadingV2,
    error: errorV2,
    data: dataV2,
    fetchMore: fetchMoreV2,
  } = GraphQLApi.useV2PairTransactionsQuery({
    variables: {
      ...variables,
      address,
    },
    skip: !chainId || protocolVersion !== GraphQLApi.ProtocolVersion.V2 || isSolanaChain || v2Enabled,
  })
  const loadingMore = useRef(false)
  const {
    transactions: legacyTransactions,
    loading,
    fetchMore,
    error,
  } = protocolVersion === GraphQLApi.ProtocolVersion.V4
    ? { transactions: dataV4?.v4Pool?.transactions, loading: loadingV4, fetchMore: fetchMoreV4, error: errorV4 }
    : protocolVersion === GraphQLApi.ProtocolVersion.V3
      ? { transactions: dataV3?.v3Pool?.transactions, loading: loadingV3, fetchMore: fetchMoreV3, error: errorV3 }
      : { transactions: dataV2?.v2Pair?.transactions, loading: loadingV2, fetchMore: fetchMoreV2, error: errorV2 }

  const transactions = v2Enabled ? v2Transactions : legacyTransactions

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true
      fetchMore({
        variables: {
          cursor: legacyTransactions?.[legacyTransactions.length - 1]?.timestamp,
        },
        updateQuery: (prev, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) {
            loadingMore.current = false
            return prev
          }
          onComplete?.()
          const mergedData =
            protocolVersion === GraphQLApi.ProtocolVersion.V4
              ? {
                  v4Pool: {
                    ...fetchMoreResult.v4Pool,
                    transactions: [
                      ...((prev as GraphQLApi.V4PoolTransactionsQuery).v4Pool?.transactions ?? []),
                      ...fetchMoreResult.v4Pool.transactions,
                    ],
                  },
                }
              : protocolVersion === GraphQLApi.ProtocolVersion.V3
                ? {
                    v3Pool: {
                      ...fetchMoreResult.v3Pool,
                      transactions: [
                        ...((prev as GraphQLApi.V3PoolTransactionsQuery).v3Pool?.transactions ?? []),
                        ...fetchMoreResult.v3Pool.transactions,
                      ],
                    },
                  }
                : {
                    v2Pair: {
                      ...fetchMoreResult.v2Pair,
                      transactions: [
                        ...((prev as GraphQLApi.V2PairTransactionsQuery).v2Pair?.transactions ?? []),
                        ...fetchMoreResult.v2Pair.transactions,
                      ],
                    },
                  }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [fetchMore, legacyTransactions, protocolVersion],
  )

  const filteredTransactions = useMemo(() => {
    return (transactions ?? [])
      .map((tx) => {
        if (!tx) {
          return undefined
        }
        const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
        const token0Address =
          token0?.address === NATIVE_CHAIN_ID
            ? WRAPPED_NATIVE_CURRENCY[chainId ?? UniverseChainId.Mainnet]?.address
            : token0?.address
        const isSell = areAddressesEqual({
          addressInput1: {
            address: tokenIn.address,
            chainId: fromGraphQLChain(tokenIn.chain) ?? UniverseChainId.Mainnet,
          },
          addressInput2: { address: token0Address, chainId: chainId ?? UniverseChainId.Mainnet },
        })
        const type =
          tx.type === GraphQLApi.PoolTransactionType.Swap
            ? isSell
              ? PoolTableTransactionType.SELL
              : PoolTableTransactionType.BUY
            : tx.type === GraphQLApi.PoolTransactionType.Remove
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
      loading: v2Enabled ? v2Loading : loading,
      loadMore: v2Enabled ? v2LoadMore : loadMore,
      error: v2Enabled ? connectErrorToApolloError(v2Error) : error,
    }
  }, [filteredTransactions, loading, loadMore, error, v2Enabled, v2Loading, v2LoadMore, v2Error])
}

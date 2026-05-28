import { useQuery } from '@apollo/client'
import { useQueryClient } from 'appGraphql/data/apollo/client'
import gql from 'graphql-tag'
import { useCallback, useMemo, useRef } from 'react'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

import { PoolTableTransactionType } from 'appGraphql/data/pools/usePoolTransactions'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import {
  PoolTransaction,
  PoolTransactionType,
  Token,
} from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'

const GET_POOL_TRANSACTIONS = () => {
  const queryString = `
    query GetTransactions($after: String, $limit: Int, $orderBy: String = "timestamp", $orderDirection: String = "desc", $where: poolTransactionFilter) {
      poolTransactions(
        after: $after
        limit: $limit
        orderBy: $orderBy
        orderDirection: $orderDirection
        where: $where
      ) {
        items {
          id
          poolId
          chain
          protocolVersion
          type
          account
          hash
          timestamp
          token0Quantity
          token1Quantity
          usdValue
          token0 {
            id
            chain
            address
            originToken {
              address
              name
              symbol
              decimals
            }
          }
          token1 {
            id
            chain
            address
            originToken {
              address
              name
              symbol
              decimals
            }
          }
        }
        pageInfo {
          startCursor
          endCursor
          hasPreviousPage
          hasNextPage
        }
      }
    }
  `
  return gql(queryString)
}

function useGetPoolTransactionsQuery(variables: {
  poolId: string
  chain: Chain
  type?: string
  after?: string
  limit?: number
  orderBy?: string
  orderDirection?: string
}) {
  const client = useQueryClient(variables.chain)
  const poolAddress = variables.poolId.split('_').pop()

  const where = {
    OR: [
      { poolId: `V2Pair:${variables.chain}_${poolAddress}` },
      { poolId: `V3Pool:${variables.chain}_${poolAddress}` },
      { poolId: `V4Pool:${variables.chain}_${poolAddress}` },
    ],
  }

  return useQuery(GET_POOL_TRANSACTIONS(), {
    variables: {
      after: variables.after,
      limit: variables.limit,
      orderBy: variables.orderBy,
      orderDirection: variables.orderDirection,
      where,
    },
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    client,
  })
}

interface PoolTableTransaction {
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

export function useRingPoolTransactions(
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
  first = PoolTransactionDefaultQuerySize,
) {
  const defaultChainId = UniverseChainId.Mainnet
  const variables = { poolId: address, chain: toGraphQLChain(chainId ?? defaultChainId), limit: first }
  const {
    loading: loading,
    error: error,
    data: data,
    fetchMore: fetchMore,
  } = useGetPoolTransactionsQuery({
    ...variables,
  })
  const loadingMore = useRef(false)
  const pageInfo = data?.poolTransactions?.pageInfo

  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      const after = pageInfo.endCursor
      loadingMore.current = true
      fetchMore({
        variables: {
          limit: PoolTransactionDefaultQuerySize,
          ...(after ? { after } : {}),
        },
        updateQuery: (prev: any, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) {
            loadingMore.current = false
            return prev
          }
          onComplete?.()
          loadingMore.current = false
          return {
            poolTransactions: {
              ...fetchMoreResult.poolTransactions,
              items: [...prev.poolTransactions.items, ...fetchMoreResult.poolTransactions.items],
            },
          }
        },
      })
    },
    [fetchMore, pageInfo?.endCursor],
  )

  const filteredTransactions = useMemo(() => {
    return (data?.poolTransactions?.items ?? [])
      ?.map((tx: PoolTransaction) => {
        if (!tx) {
          return undefined
        }
        const tokenIn = parseFloat(tx.token0Quantity) > 0 ? tx.token0 : tx.token1
        const token0Address =
          token0?.originToken?.address === NATIVE_CHAIN_ID
            ? WRAPPED_NATIVE_CURRENCY[chainId ?? UniverseChainId.Mainnet]?.address
            : token0?.originToken?.address
        const isSell = tokenIn?.originToken?.address?.toLowerCase() === token0Address?.toLowerCase()
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
              id: tx?.token0?.originToken?.address ?? null,
              symbol: tx?.token0?.originToken?.symbol ?? '',
            },
            token1: {
              id: tx?.token1?.originToken?.address ?? null,
              symbol: tx?.token1?.originToken?.symbol ?? '',
            },
          },
          maker: tx.account,
          amount0: parseFloat(tx.token0Quantity),
          amount1: parseFloat(tx.token1Quantity),
          amountUSD: parseFloat(tx.usdValue),
          type,
        }
      })
      .filter((value: PoolTableTransaction | undefined): value is PoolTableTransaction => value !== undefined)
  }, [data?.poolTransactions?.items, token0?.originToken?.address, chainId, filter])

  return useMemo(() => {
    return {
      transactions: filteredTransactions,
      loading,
      loadMore,
      error,
    }
  }, [filteredTransactions, loading, loadMore, error])
}

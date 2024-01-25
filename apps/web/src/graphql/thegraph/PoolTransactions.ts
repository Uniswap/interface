import { gql } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { useCallback, useMemo, useRef } from 'react'
import { countSignificantFigures } from 'utils'

import { OrderDirection, Transaction_OrderBy, usePoolTransactionsQuery } from './__generated__/types-and-hooks'
import { chainToApolloClient } from './apollo'

// TODO(WEB-3236): once GQL BE Transaction query is supported add usd, token0 amount, and token1 amount sort support
gql`
  query PoolTransactions(
    $address: String!
    $first: Int
    $skip: Int
    $orderBy: Transaction_orderBy
    $orderDirection: OrderDirection
  ) {
    mints(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
      where: { pool: $address }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      owner
      sender
      origin
      amount0
      amount1
      amountUSD
    }
    swaps(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
      where: { pool: $address }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      origin
      amount0
      amount1
      amountUSD
    }
    burns(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: $orderDirection
      where: { pool: $address }
      subgraphError: allow
    ) {
      timestamp
      transaction {
        id
      }
      pool {
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
      origin
      amount
      amount0
      amount1
      amountUSD
    }
  }
`

export enum PoolTransactionType {
  BUY = 'Buy',
  SELL = 'Sell',
  BURN = 'Burn',
  MINT = 'Mint',
}

export interface PoolTransaction {
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
  amountUSD: string
  type: PoolTransactionType
  isExactIn?: boolean
}

export function usePoolTransactions(
  address: string,
  chainId?: ChainId,
  orderBy: Transaction_OrderBy = Transaction_OrderBy.Timestamp,
  orderDirection: OrderDirection = OrderDirection.Desc,
  filter: PoolTransactionType[] = [
    PoolTransactionType.BUY,
    PoolTransactionType.SELL,
    PoolTransactionType.BURN,
    PoolTransactionType.MINT,
  ],
  first = 25,
  skip?: number
) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { data, loading, fetchMore, error } = usePoolTransactionsQuery({
    variables: {
      address: address.toLowerCase(),
      first,
      skip,
      orderBy,
      orderDirection,
    },
    client: apolloClient,
  })
  const loadingMore = useRef(false)
  const loadMore = useCallback(
    ({ onComplete }: { onComplete?: () => void }) => {
      if (loadingMore.current) {
        return
      }
      loadingMore.current = true
      fetchMore({
        variables: {
          skip: Math.max(data?.swaps?.length ?? 0, data?.mints?.length ?? 0, data?.burns?.length ?? 0),
        },
        updateQuery: (prev, { fetchMoreResult }: any) => {
          if (!fetchMoreResult) return prev
          onComplete?.()
          const mergedData = {
            mints: [...prev.mints, ...fetchMoreResult.mints],
            swaps: [...prev.swaps, ...fetchMoreResult.swaps],
            burns: [...prev.burns, ...fetchMoreResult.burns],
          }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [data?.burns?.length, data?.mints?.length, data?.swaps?.length, fetchMore]
  )

  const transactions = useMemo(() => {
    const mints = filter.includes(PoolTransactionType.MINT)
      ? data?.mints.map((tx) => {
          return { ...tx, type: PoolTransactionType.MINT, isExactIn: undefined }
        })
      : []
    const burns = filter.includes(PoolTransactionType.BURN)
      ? data?.burns
          .map((tx) => {
            return { ...tx, type: PoolTransactionType.BURN, isExactIn: undefined }
          })
          .filter((tx) => tx.amount0 !== '0' && tx.amount1 !== '0') // filter out collecting fees
      : []
    const swaps =
      filter.includes(PoolTransactionType.BUY) || filter.includes(PoolTransactionType.SELL)
        ? data?.swaps
            .map((tx) => {
              const tokenIn = tx.amount0 > 0 ? tx.pool.token0 : tx.pool.token1
              // Determine if swap is exact in vs exact out based on which amount has fewer sig figs
              const token0SigFigs = countSignificantFigures(tx.amount0)
              const token1SigFigs = countSignificantFigures(tx.amount1)
              const isExactIn =
                tokenIn.id.toLowerCase() === tx.pool.token0?.id.toLowerCase()
                  ? token0SigFigs < token1SigFigs
                  : token1SigFigs < token0SigFigs
              if (isExactIn && filter.includes(PoolTransactionType.SELL))
                return { ...tx, type: PoolTransactionType.SELL, isExactIn }
              else if (!isExactIn && filter.includes(PoolTransactionType.BUY))
                return { ...tx, type: PoolTransactionType.BUY, isExactIn }
              return undefined
            })
            .filter((tx) => tx !== undefined)
        : []
    return [...(mints ?? []), ...(swaps ?? []), ...(burns ?? [])]
      .sort((a, b) => b?.timestamp - a?.timestamp)
      .map((tx) => {
        return {
          timestamp: tx?.timestamp,
          transaction: tx?.transaction.id,
          pool: {
            token0: {
              id: tx?.pool.token0.id,
              symbol: tx?.pool.token0.symbol,
            },
            token1: {
              id: tx?.pool.token1.id,
              symbol: tx?.pool.token1.symbol,
            },
          },
          maker: tx?.origin,
          amount0: tx?.amount0,
          amount1: tx?.amount1,
          amountUSD: tx?.amountUSD,
          type: tx?.type,
          isExactIn: tx?.isExactIn,
        } as PoolTransaction
      })
  }, [data?.burns, data?.mints, data?.swaps, filter])

  return useMemo(() => {
    return {
      transactions,
      loading,
      loadMore,
      error,
    }
  }, [transactions, loading, loadMore, error])
}

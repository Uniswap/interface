import { gql } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import {
  OrderDirection,
  Transaction_OrderBy,
  useTransactionsQuery,
} from 'graphql/thegraph/__generated__/types-and-hooks'
import { chainToApolloClient } from 'graphql/thegraph/apollo'
import { useCallback, useMemo, useRef } from 'react'

gql`
  query Transactions($first: Int, $skip: Int, $orderBy: Transaction_orderBy, $orderDirection: OrderDirection) {
    transactions(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection, subgraphError: allow) {
      id
      timestamp
      mints {
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
      swaps {
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
      burns {
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
        origin
        amount0
        amount1
        amountUSD
      }
    }
  }
`
type TransactionEntry = {
  timestamp: string
  id: string
  mints: {
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
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
  swaps: {
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
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
  burns: {
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
    owner: string
    origin: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
}

export enum TransactionType {
  SWAP = 'Swap',
  MINT = 'Add',
  BURN = 'Remove',
}

export type Transaction = {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0Symbol: string
  token1Symbol: string
  token0Address: string
  token1Address: string
  amountUSD: number
  amountToken0: number
  amountToken1: number
}

interface TransactionResults {
  transactions: TransactionEntry[]
}

export function useRecentTransactions(
  chainId: number,
  orderBy: Transaction_OrderBy = Transaction_OrderBy.Timestamp,
  orderDirection: OrderDirection = OrderDirection.Desc,
  filter: TransactionType[] = [TransactionType.SWAP, TransactionType.MINT, TransactionType.BURN]
) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { data, loading, fetchMore } = useTransactionsQuery({
    variables: {
      first: 20,
      skip: 0,
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
          skip: data?.transactions?.length ?? 0,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev
          onComplete?.()
          const mergedData = {
            transactions: [...prev.transactions, ...fetchMoreResult.transactions],
          }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [data?.transactions?.length, fetchMore]
  )

  const transactions = useMemo(
    () =>
      (data as TransactionResults)?.transactions?.reduce((accum: Transaction[], t: TransactionEntry) => {
        const mints = filter.includes(TransactionType.MINT)
          ? t.mints.map((m) => {
              return {
                type: TransactionType.MINT,
                hash: t.id,
                timestamp: t.timestamp,
                sender: m.origin,
                token0Symbol: m.pool.token0.symbol,
                token1Symbol: m.pool.token1.symbol,
                token0Address: m.pool.token0.id,
                token1Address: m.pool.token1.id,
                amountUSD: parseFloat(m.amountUSD),
                amountToken0: parseFloat(m.amount0),
                amountToken1: parseFloat(m.amount1),
              }
            })
          : []
        const burns = filter.includes(TransactionType.BURN)
          ? t.burns.map((m) => {
              return {
                type: TransactionType.BURN,
                hash: t.id,
                timestamp: t.timestamp,
                sender: m.origin,
                token0Symbol: m.pool.token0.symbol,
                token1Symbol: m.pool.token1.symbol,
                token0Address: m.pool.token0.id,
                token1Address: m.pool.token1.id,
                amountUSD: parseFloat(m.amountUSD),
                amountToken0: parseFloat(m.amount0),
                amountToken1: parseFloat(m.amount1),
              }
            })
          : []

        const swaps = filter.includes(TransactionType.SWAP)
          ? t.swaps.map((m) => {
              return {
                hash: t.id,
                type: TransactionType.SWAP,
                timestamp: t.timestamp,
                sender: m.origin,
                token0Symbol: m.pool.token0.symbol,
                token1Symbol: m.pool.token1.symbol,
                token0Address: m.pool.token0.id,
                token1Address: m.pool.token1.id,
                amountUSD: parseFloat(m.amountUSD),
                amountToken0: parseFloat(m.amount0),
                amountToken1: parseFloat(m.amount1),
              }
            })
          : []
        accum = [...accum, ...mints, ...burns, ...swaps]
        return accum
      }, []),
    [data, filter]
  )

  return useMemo(
    () => ({
      transactions,
      loading,
      loadMore,
    }),
    [transactions, loading, loadMore]
  )
}

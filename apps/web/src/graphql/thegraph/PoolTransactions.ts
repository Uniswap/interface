import { gql } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { useCallback, useMemo, useRef } from 'react'

import { usePoolTransactionsQuery } from './__generated__/types-and-hooks'
import { chainToApolloClient } from './apollo'

gql`
  query PoolTransactions($address: String!, $first: Int, $skip: Int) {
    mints(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
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
      orderDirection: desc
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
      orderDirection: desc
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
  SWAP,
  BURN,
  MINT,
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
}

export function usePoolTransactions(address: string, chainId?: ChainId, first = 25, skip?: number) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { data, loading, fetchMore, error } = usePoolTransactionsQuery({
    variables: {
      address: address.toLowerCase(),
      first,
      skip,
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
    [data, fetchMore]
  )
  const mints = data?.mints.map((tx) => {
    return { ...tx, type: PoolTransactionType.MINT }
  })
  const burns = data?.burns
    .map((tx) => {
      return { ...tx, type: PoolTransactionType.BURN }
    })
    .filter((tx) => tx.amount0 !== '0' && tx.amount1 !== '0') // filter out collecting fees
  const swaps = data?.swaps.map((tx) => {
    return { ...tx, type: PoolTransactionType.SWAP }
  })

  const transactions = useMemo(
    () =>
      [...(mints ?? []), ...(swaps ?? []), ...(burns ?? [])]
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((tx) => {
          return {
            timestamp: tx.timestamp,
            transaction: tx.transaction.id,
            pool: {
              token0: {
                id: tx.pool.token0.id,
                symbol: tx.pool.token0.symbol,
              },
              token1: {
                id: tx.pool.token1.id,
                symbol: tx.pool.token1.symbol,
              },
            },
            maker: tx.origin,
            amount0: tx.amount0,
            amount1: tx.amount1,
            amountUSD: tx.amountUSD,
            type: tx.type,
          } as PoolTransaction
        }),
    [burns, mints, swaps]
  )

  return useMemo(() => {
    return {
      transactions,
      loading,
      loadMore,
      error,
    }
  }, [transactions, loading, loadMore, error])
}

import { gql } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { OrderDirection, Pool_OrderBy, Token, useTopPoolsQuery } from './__generated__/types-and-hooks'
import { chainToApolloClient } from './apollo'

gql`
  query TopPools($orderBy: Pool_orderBy, $orderDirection: OrderDirection) {
    pools(
      first: 100
      orderBy: $orderBy
      orderDirection: $orderDirection
      subgraphError: allow
      where: { txCount_gte: 100 }
    ) {
      id
      txCount
      totalValueLockedUSD
      feeTier
      token0 {
        id
        symbol
      }
      token1 {
        id
        symbol
      }
    }
  }
`

export interface TablePool {
  hash: string
  token0: Token
  token1: Token
  txCount: number
  tvl: number
  volume24h: number
  volumeWeek: number
  turnover: number
  feeTier: number
}

export function useTopPools(
  chainId?: ChainId,
  orderBy: Pool_OrderBy = Pool_OrderBy.TotalValueLockedUsd,
  orderDirection: OrderDirection = OrderDirection.Desc
) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { loading, error, data } = useTopPoolsQuery({
    client: apolloClient,
    fetchPolicy: 'no-cache',
    variables: { orderBy, orderDirection },
  })

  return useMemo(() => {
    const topPools: TablePool[] | undefined = data?.pools
      .filter((topPool) => topPool.token0.id && topPool.token1.id)
      .map((topPool) => {
        const rand = Math.random()
        const tvl = parseFloat(topPool.totalValueLockedUSD ?? '0')
        return {
          hash: topPool.id,
          token0: topPool.token0,
          token1: topPool.token1,
          txCount: parseFloat(topPool.txCount ?? '0'),
          tvl,
          feeTier: parseFloat(topPool.feeTier ?? '0'),
          // TODO(WEB-3236): once GQL BE TopToken query is supported use real value for volume24h, volumeWeek, and turnover
          volume24h: rand * tvl,
          volumeWeek: rand * tvl * 7,
          turnover: rand,
        } as TablePool
      })
    return { loading, error, topPools }
  }, [data?.pools, error, loading])
}

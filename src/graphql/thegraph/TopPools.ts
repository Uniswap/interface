import { gql } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import { useMemo } from 'react'

import { useTopPoolsQuery } from './__generated__/types-and-hooks'
import { chainToApolloClient } from './apollo'

gql`
  query TopPools($block: Block_height = null) {
    pools(
      first: 100
      block: $block
      orderBy: totalValueLockedUSD
      orderDirection: desc
      subgraphError: allow
      where: { txCount_gte: 100 }
    ) {
      id
      txCount
      totalValueLockedUSD
      feeTier
      token0 {
        id
      }
      token1 {
        id
      }
    }
    bundles(where: { id: "1" }) {
      ethPriceUSD
    }
  }
`

interface TopPool {
  hash: string
  token0: string
  token1: string
  txCount: number
  tvl: number
  volume24h: number
  volumeWeek: number
  turnover: number
  feeTier: number
}

export function useTopPools(chainId?: ChainId) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { loading, error, data } = useTopPoolsQuery({
    client: apolloClient,
    fetchPolicy: 'no-cache',
  })

  return useMemo(() => {
    const topPools: TopPool[] | undefined = data?.pools.map((topPool) => {
      const rand = Math.random()
      const tvl = parseFloat(topPool.totalValueLockedUSD ?? '0')
      return {
        hash: topPool.id,
        token0: topPool.token0.id,
        token1: topPool.token1.id,
        txCount: parseFloat(topPool.txCount ?? '0'),
        tvl,
        feeTier: parseFloat(topPool.feeTier ?? '0'),
        // TODO(): once GQL BE TopToken query is supported use real value for volume24h, volumeWeek, and turnover
        volume24h: rand * tvl,
        volumeWeek: rand * tvl * 7,
        turnover: rand,
      } as TopPool
    })
    return { loading, error, topPools }
  }, [data?.pools, error, loading])
}

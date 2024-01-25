import { ChainId } from '@uniswap/sdk-core'
import {
  OrderDirection,
  Pool_OrderBy,
  usePoolsFromTokenAddressQuery,
} from 'graphql/thegraph/__generated__/types-and-hooks'
import { chainToApolloClient } from 'graphql/thegraph/apollo'
import { TablePool } from 'graphql/thegraph/TopPools'
import gql from 'graphql-tag'
import { useCallback, useMemo, useRef } from 'react'

gql`
  query PoolsFromTokenAddress(
    $tokenAddress: String!
    $skip: Int
    $orderBy: Pool_orderBy
    $orderDirection: OrderDirection
  ) {
    pools(
      where: { or: [{ token0: $tokenAddress }, { token1: $tokenAddress }] }
      first: 20
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      subgraphError: allow
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

export function usePoolsFromTokenAddress(
  tokenAddress: string,
  chainId?: ChainId,
  orderBy: Pool_OrderBy = Pool_OrderBy.TotalValueLockedUsd,
  orderDirection: OrderDirection = OrderDirection.Desc
) {
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]
  const { loading, error, data, fetchMore } = usePoolsFromTokenAddressQuery({
    variables: {
      tokenAddress: tokenAddress.toLowerCase(),
      orderBy,
      orderDirection,
    },
    client: apolloClient,
    fetchPolicy: 'cache-first',
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
          skip: data?.pools?.length ?? 0,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult || !prev || !Object.keys(prev).length) return prev
          onComplete?.()
          const mergedData = {
            pools: [...prev.pools, ...fetchMoreResult.pools],
          }
          loadingMore.current = false
          return mergedData
        },
      })
    },
    [data?.pools?.length, fetchMore]
  )

  return useMemo(() => {
    const pools: TablePool[] = (data?.pools ?? [])
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
      .sort((a, b) => b.tvl - a.tvl)
    return { loading, error, pools, loadMore }
  }, [data?.pools, error, loadMore, loading])
}

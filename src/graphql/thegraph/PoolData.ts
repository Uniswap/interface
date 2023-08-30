import { ApolloClient, InMemoryCache } from '@apollo/client'
import { ChainId } from '@uniswap/sdk-core'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { usePoolDataQuery } from './__generated__/types-and-hooks'
import { CHAIN_SUBGRAPH_URL } from './apollo'

gql`
  query PoolData($poolId: [ID!]) {
    data: pools(where: { id_in: $poolId }, orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
      id
      feeTier
      liquidity
      sqrtPrice
      tick
      token0 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      token1 {
        id
        symbol
        name
        decimals
        derivedETH
      }
      token0Price
      token1Price
      volumeUSD
      volumeToken0
      volumeToken1
      txCount
      totalValueLockedToken0
      totalValueLockedToken1
      totalValueLockedUSD
    }
    bundles(where: { id: "1" }) {
      ethPriceUSD
    }
  }
`

export function usePoolData(poolAddress: string, chainId: ChainId) {
  const poolId = [poolAddress]
  const apolloClient = useMemo(
    () =>
      new ApolloClient({
        cache: new InMemoryCache(),
        uri: CHAIN_SUBGRAPH_URL[chainId],
      }),
    [chainId]
  )
  const { data, loading } = usePoolDataQuery({ variables: { poolId }, client: apolloClient })
  return useMemo(() => {
    return {
      data: data?.data[0],
      loading,
    }
  }, [data, loading])
}

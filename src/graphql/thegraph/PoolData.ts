import { useQuery } from '@apollo/client/react'
import { ChainId } from '@uniswap/sdk-core'
import gql from 'graphql-tag'
import { useMemo } from 'react'

import { chainToApolloClient } from './apollo'
import { useBlocksFromTimestamps } from './useBlocksFromTimestamps'
import { useDeltaTimestamps } from './utils'

const POOLS_BULK = (pools: string[], block?: number) => {
  let poolString = `[`
  pools.map((address) => {
    return (poolString += `"${address}",`)
  })
  poolString += ']'
  const queryString =
    `
    query pools {
      pools(where: {id_in: ${poolString}},` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
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
      bundles (where: {id: "1"}) {
        ethPriceUSD
      }
    }
    `
  return gql(queryString)
}

export function usePoolData(poolAddress: string, chainId?: ChainId) {
  const poolId = [poolAddress]
  const apolloClient = chainToApolloClient[chainId || ChainId.MAINNET]

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek], chainId || ChainId.MAINNET)
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery(POOLS_BULK(poolId, undefined), {
    client: apolloClient,
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery(POOLS_BULK(poolId, block24?.number), { client: apolloClient })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery(POOLS_BULK(poolId, block48?.number), { client: apolloClient })
  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery(POOLS_BULK(poolId, blockWeek?.number), { client: apolloClient })

  return useMemo(() => {
    const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
    const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)
    return {
      data: data?.pools[0],
      error: anyError,
      loading: anyLoading,
    }
  }, [blockError, data?.pools, error, error24, error48, errorWeek, loading, loading24, loading48, loadingWeek])
}

/**
 * Taiko Top Pools Query
 *
 * Custom implementation for querying pool data from Goldsky's Taiko V3 subgraph.
 */

import { useQuery, gql, ApolloError } from '@apollo/client'
import { useMemo } from 'react'
import { getClient } from '../thegraph/apollo'
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'

/**
 * Pool data structure from Goldsky V3 subgraph
 */
export interface TaikoPool {
  id: string // pool address
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
  }
  feeTier: string
  liquidity: string
  sqrtPrice: string
  token0Price: string
  token1Price: string
  volumeUSD: string
  feesUSD: string
  txCount: string
  totalValueLockedUSD: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  liquidityProviderCount: string
}

/**
 * GraphQL query for top pools on Taiko
 */
const TAIKO_TOP_POOLS_QUERY = gql`
  query TaikoTopPools($first: Int!, $orderBy: String!, $orderDirection: String!) {
    pools(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      liquidity
      sqrtPrice
      token0Price
      token1Price
      volumeUSD
      feesUSD
      txCount
      totalValueLockedUSD
      totalValueLockedToken0
      totalValueLockedToken1
      liquidityProviderCount
    }
  }
`

/**
 * Pool data normalized for display
 */
export interface NormalizedTaikoPool {
  id: string
  token0Symbol: string
  token1Symbol: string
  token0Name: string
  token1Name: string
  feeTier: number // in basis points (500 = 0.05%)
  tvlUSD: number
  volumeUSD: number
  feesUSD: number
  txCount: number
  liquidityProviderCount: number
  token0Price: number
  token1Price: number
  apr?: number // Annual percentage rate (calculated from fees)
}

export interface UseTopPoolsTaikoResult {
  pools?: readonly NormalizedTaikoPool[]
  loadingPools: boolean
  error?: ApolloError
  refetch: () => void
}

/**
 * Hook to fetch and normalize top pools from Taiko Goldsky V3 subgraph
 */
export function useTopPoolsTaiko(
  first: number = 100,
  orderBy: 'totalValueLockedUSD' | 'volumeUSD' = 'totalValueLockedUSD'
): UseTopPoolsTaikoResult {
  // Get the Apollo client for Taiko Hoodi from thegraph apollo
  const client = getClient(TAIKO_HOODI_CHAIN_ID)

  const { data, loading, error, refetch } = useQuery<{ pools: TaikoPool[] }>(TAIKO_TOP_POOLS_QUERY, {
    client,
    variables: {
      first,
      orderBy,
      orderDirection: 'desc',
    },
    pollInterval: 60000, // Poll every 60 seconds
  })

  // Normalize pools for display
  const normalizedPools = useMemo(() => {
    if (!data?.pools) return undefined

    return data.pools.map((pool): NormalizedTaikoPool => {
      const tvlUSD = parseFloat(pool.totalValueLockedUSD)
      const volumeUSD = parseFloat(pool.volumeUSD)
      const feesUSD = parseFloat(pool.feesUSD)
      const feeTier = parseInt(pool.feeTier)

      // Calculate APR: (annual fees / TVL) * 100
      // Assuming current fees represent daily fees, multiply by 365
      const dailyFees = feesUSD // This is cumulative, so we'd need historical data for true daily
      const estimatedApr = tvlUSD > 0 ? (dailyFees / tvlUSD) * 100 : 0

      return {
        id: pool.id.toLowerCase(),
        token0Symbol: pool.token0.symbol,
        token1Symbol: pool.token1.symbol,
        token0Name: pool.token0.name,
        token1Name: pool.token1.name,
        feeTier,
        tvlUSD,
        volumeUSD,
        feesUSD,
        txCount: parseInt(pool.txCount),
        liquidityProviderCount: parseInt(pool.liquidityProviderCount),
        token0Price: parseFloat(pool.token0Price),
        token1Price: parseFloat(pool.token1Price),
        apr: estimatedApr,
      }
    })
  }, [data])

  return {
    pools: normalizedPools,
    loadingPools: loading,
    error,
    refetch,
  }
}

/**
 * Query for protocol-wide TVL stats
 */
const TAIKO_PROTOCOL_STATS_QUERY = gql`
  query TaikoProtocolStats {
    factories(first: 1) {
      id
      totalVolumeUSD
      totalValueLockedUSD
      totalFeesUSD
      txCount
      poolCount
    }
  }
`

export interface TaikoProtocolStats {
  totalVolumeUSD: number
  totalValueLockedUSD: number
  totalFeesUSD: number
  txCount: number
  poolCount: number
}

export interface UseProtocolStatsTaikoResult {
  stats?: TaikoProtocolStats
  loading: boolean
  error?: ApolloError
}

/**
 * Hook to fetch protocol-wide statistics
 */
export function useProtocolStatsTaiko(): UseProtocolStatsTaikoResult {
  const client = getClient(TAIKO_HOODI_CHAIN_ID)

  const { data, loading, error } = useQuery<{
    factories: Array<{
      totalVolumeUSD: string
      totalValueLockedUSD: string
      totalFeesUSD: string
      txCount: string
      poolCount: string
    }>
  }>(TAIKO_PROTOCOL_STATS_QUERY, {
    client,
    pollInterval: 60000,
  })

  const stats = useMemo(() => {
    if (!data?.factories?.[0]) return undefined

    const factory = data.factories[0]
    return {
      totalVolumeUSD: parseFloat(factory.totalVolumeUSD),
      totalValueLockedUSD: parseFloat(factory.totalValueLockedUSD),
      totalFeesUSD: parseFloat(factory.totalFeesUSD),
      txCount: parseInt(factory.txCount),
      poolCount: parseInt(factory.poolCount),
    }
  }, [data])

  return {
    stats,
    loading,
    error,
  }
}

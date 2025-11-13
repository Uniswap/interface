/**
 * Taiko Top Tokens Query
 *
 * Custom implementation for querying token data from Goldsky's Taiko subgraph.
 * This is necessary because Uniswap's AWS backend doesn't support Taiko chains.
 *
 * The Goldsky token subgraph uses The Graph's standard schema for Uniswap V3 tokens.
 */

import { useQuery, gql, ApolloError } from '@apollo/client'
import { useMemo } from 'react'
import { taikoTokenClient } from './apollo'
import { TimePeriod } from '../data/util'

/**
 * Token data structure from Goldsky subgraph
 * Based on Uniswap V3 subgraph schema
 */
export interface TaikoToken {
  id: string // token address (lowercase)
  symbol: string
  name: string
  decimals: string
  volumeUSD: string
  totalValueLockedUSD: string
  feesUSD: string
  txCount: string
  // Derived fields
  derivedETH?: string
  priceUSD?: string
}

/**
 * GraphQL query for top tokens on Taiko
 * Orders by volumeUSD to match the TopTokens behavior on other chains
 */
const TAIKO_TOP_TOKENS_QUERY = gql`
  query TaikoTopTokens($orderBy: String!, $orderDirection: String!) {
    tokens(
      first: 100
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      symbol
      name
      decimals
      volumeUSD
      totalValueLockedUSD
      feesUSD
      txCount
      derivedETH
    }
  }
`

/**
 * Token data normalized to match the interface expected by TokenTable
 */
export interface NormalizedTaikoToken {
  address: string
  chain: 'TAIKO_HOODI'
  symbol?: string
  name?: string
  decimals?: number
  project?: {
    logoUrl?: string
  }
  market?: {
    price?: {
      value: number
    }
    pricePercentChange?: {
      value: number
    }
    volume?: {
      value: number
    }
    totalValueLocked?: {
      value: number
    }
  }
}

export interface UseTopTokensTaikoResult {
  tokens?: readonly NormalizedTaikoToken[]
  tokenSortRank: Record<string, number>
  loadingTokens: boolean
  sparklines: Record<string, any>
  error?: ApolloError
}

/**
 * Hook to fetch and normalize top tokens from Taiko Goldsky subgraph
 *
 * @param timePeriod - Time period for filtering (note: current implementation doesn't filter by time)
 * @returns Normalized token data compatible with TokenTable component
 */
export function useTopTokensTaiko(timePeriod: TimePeriod = TimePeriod.DAY): UseTopTokensTaikoResult {
  const { data, loading, error } = useQuery<{ tokens: TaikoToken[] }>(TAIKO_TOP_TOKENS_QUERY, {
    client: taikoTokenClient,
    variables: {
      // Use TVL for ordering since volume may be zero on new testnets
      orderBy: 'totalValueLockedUSD',
      orderDirection: 'desc',
    },
    pollInterval: 60000, // Poll every 60 seconds
  })

  // Normalize tokens to match the format expected by TokenTable
  const normalizedTokens = useMemo(() => {
    if (!data?.tokens) return undefined

    return data.tokens.map((token): NormalizedTaikoToken => {
      const volumeUSD = parseFloat(token.volumeUSD)
      const tvlUSD = parseFloat(token.totalValueLockedUSD)
      const derivedETH = parseFloat(token.derivedETH || '0')

      return {
        address: token.id.toLowerCase(),
        chain: 'TAIKO_HOODI',
        symbol: token.symbol,
        name: token.name,
        decimals: parseInt(token.decimals),
        project: {
          // Token logos would need to be added separately
          logoUrl: undefined,
        },
        market: {
          price: {
            value: derivedETH, // Use derivedETH as price proxy
          },
          pricePercentChange: {
            // Note: Goldsky token subgraph may not have historical price data
            // This would require additional queries or a different subgraph
            value: 0,
          },
          volume: {
            value: volumeUSD,
          },
          totalValueLocked: {
            value: tvlUSD,
          },
        },
      }
    })
  }, [data])

  // Create token sort rank mapping (by volume)
  const tokenSortRank = useMemo(() => {
    if (!normalizedTokens) return {}

    return normalizedTokens.reduce((acc, token, index) => {
      acc[token.address] = index + 1
      return acc
    }, {} as Record<string, number>)
  }, [normalizedTokens])

  // Sparklines are not supported in the current Goldsky token subgraph
  // This would require historical price data queries
  const sparklines = useMemo(() => ({}), [])

  return {
    tokens: normalizedTokens,
    tokenSortRank,
    loadingTokens: loading,
    sparklines,
    error,
  }
}

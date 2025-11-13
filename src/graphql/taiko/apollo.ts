/**
 * Apollo Client for Taiko Goldsky Subgraphs
 *
 * This module provides GraphQL clients for querying Taiko-specific data
 * from Goldsky subgraphs, since Uniswap's AWS backend doesn't support Taiko.
 */

import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client'
import { TAIKO_HOODI_CHAIN_ID } from 'config/chains'

/**
 * Goldsky subgraph URLs for Taiko Hoodi testnet
 */
const TAIKO_HOODI_SUBGRAPH_URLS = {
  // V3 Pool data subgraph
  pools: 'https://api.goldsky.com/api/public/project_clz85cxrvng3n01ughcv5e7hg/subgraphs/uniswap-v3-taiko-hoodi-testnet/7060ecc/gn',
  // V3 Token data subgraph (aggregated token statistics)
  tokens: 'https://api.goldsky.com/api/public/project_clz85cxrvng3n01ughcv5e7hg/subgraphs/v3-tokens-taiko-hoodi-testnet/7060ecc/gn',
} as const

/**
 * Apollo client for Taiko Hoodi token data
 * Queries the Goldsky token aggregation subgraph
 */
export const taikoTokenClient = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        // Ensure addresses are always lowercase for consistency
        fields: {
          id: {
            read(id: string): string {
              return id.toLowerCase()
            },
          },
        },
      },
    },
  }),
  link: new HttpLink({
    uri: TAIKO_HOODI_SUBGRAPH_URLS.tokens,
  }),
})

/**
 * Map of chain IDs to their token subgraph clients
 */
export const chainToTokenClient: Record<number, ApolloClient<NormalizedCacheObject>> = {
  [TAIKO_HOODI_CHAIN_ID]: taikoTokenClient,
}

/**
 * Get token subgraph client for a given chain
 */
export function getTokenClientForChain(chainId: number): ApolloClient<NormalizedCacheObject> | undefined {
  return chainToTokenClient[chainId]
}

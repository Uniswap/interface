import { Token } from '@uniswap/sdk-core'
import { GraphQLClient } from 'graphql-request'
import { useMemo } from 'react'
import { ChainId, CHAIN_INFO } from 'src/constants/chains'
import { TokenData } from 'src/features/historicalChainData/types'

export function parseTokenData(data?: TokenData[]) {
  return data
    ? data.map(({ open, close, high, low, ...rest }) => ({
        ...rest,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),
      }))
    : undefined
}

export function useV3SubgraphClient(chainId?: ChainId): GraphQLClient | undefined {
  const endpoint = useMemo(
    () => (chainId ? CHAIN_INFO[chainId].subgraphUrl : null ?? null),
    [chainId]
  )

  return useMemo(() => {
    if (!endpoint) return undefined

    // TODO: consider caching clients
    return new GraphQLClient(endpoint)
  }, [endpoint])
}

export function getTokenQueryKey({ address, chainId }: Token, additional?: {}) {
  return {
    address: address.toLowerCase(),
    chainId, // enforces key by chain
    ...additional,
  }
}

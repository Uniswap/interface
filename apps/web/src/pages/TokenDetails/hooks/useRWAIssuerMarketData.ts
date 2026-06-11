import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { RWAToken } from 'uniswap/src/features/rwa/types'

export type RWAIssuerMarketData = {
  priceUsd?: number
  marketCapUsd?: number
  volume24hUsd?: number
}

function marketDataKey(chain: string, address: string): string {
  // EVM addresses come back checksummed or lowercased from graphql; normalize so lookups match.
  // (Solana addresses are case-sensitive and pass through unchanged.)
  return `${chain}-${normalizeTokenAddressForCache(address)}`
}

export function rwaTokenMarketDataKey(token: RWAToken): string {
  return marketDataKey(toGraphQLChain(token.chainId as UniverseChainId), token.address)
}

type RWAIssuerMarketAmount = { value?: number | null } | null | undefined

type RWAIssuerMarketSource = {
  chain: string
  address?: string | null
  project?: {
    markets?: ReadonlyArray<
      | {
          price?: RWAIssuerMarketAmount
          marketCap?: RWAIssuerMarketAmount
          volume24H?: RWAIssuerMarketAmount
        }
      | null
      | undefined
    > | null
  } | null
}

export function buildRWAIssuerMarketDataMap(
  tokens: ReadonlyArray<RWAIssuerMarketSource | null | undefined>,
): Map<string, RWAIssuerMarketData> {
  const map = new Map<string, RWAIssuerMarketData>()
  for (const token of tokens) {
    if (!token?.address) {
      continue
    }
    const market = token.project?.markets?.[0]
    map.set(marketDataKey(token.chain, token.address), {
      priceUsd: market?.price?.value ?? undefined,
      marketCapUsd: market?.marketCap?.value ?? undefined,
      volume24hUsd: market?.volume24H?.value ?? undefined,
    })
  }
  return map
}

// Batched fetch of per-issuer price, market cap, and 1-day volume from each token's project market.
export function useRWAIssuerMarketData(tokens: RWAToken[]): (token: RWAToken) => RWAIssuerMarketData {
  const contracts = useMemo<GraphQLApi.ContractInput[]>(
    () => tokens.map((token) => ({ chain: toGraphQLChain(token.chainId as UniverseChainId), address: token.address })),
    [tokens],
  )

  const { data } = GraphQLApi.useRwaIssuerTokensQuery({
    variables: { contracts },
    skip: contracts.length === 0,
  })

  const marketDataByKey = useMemo(() => buildRWAIssuerMarketDataMap(data?.tokens ?? []), [data])

  return useMemo(() => (token: RWAToken) => marketDataByKey.get(rwaTokenMarketDataKey(token)) ?? {}, [marketDataByKey])
}

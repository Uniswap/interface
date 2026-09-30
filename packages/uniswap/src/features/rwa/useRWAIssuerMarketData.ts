import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import { HistoryDuration, type Token, type TokenMarket } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { useMemo } from 'react'
import {
  getGetTokenMarketsQueryOptions,
  getGetTokensQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import type { RestContract } from 'uniswap/src/features/dataApi/types'
import type { RWAToken } from 'uniswap/src/features/rwa/types'

export type RWAIssuerMarketData = {
  priceUsd?: number
  marketCapUsd?: number
  volume24hUsd?: number
}

// EVM addresses come back checksummed or lowercased from the backend; normalize so lookups match.
// Solana addresses are case-sensitive and pass through unchanged.
export function rwaTokenMarketDataKey({ chainId, address }: RestContract): string {
  return `${chainId}-${normalizeTokenAddressForCache(address)}`
}

type RWAIssuerTokenSource = Pick<PlainMessage<Token>, 'chainId' | 'address' | 'price'>
type RWAIssuerMarketSource = Pick<PlainMessage<TokenMarket>, 'chainId' | 'address' | 'stats'>

export function buildRWAIssuerMarketDataMap({
  tokens,
  markets,
}: {
  tokens: ReadonlyArray<RWAIssuerTokenSource>
  markets: ReadonlyArray<RWAIssuerMarketSource>
}): Map<string, RWAIssuerMarketData> {
  const map = new Map<string, RWAIssuerMarketData>()
  for (const token of tokens) {
    map.set(rwaTokenMarketDataKey(token), { priceUsd: token.price?.spotUsd })
  }
  for (const market of markets) {
    const key = rwaTokenMarketDataKey(market)
    map.set(key, {
      ...map.get(key),
      marketCapUsd: market.stats?.marketCapUsd,
      volume24hUsd: market.stats?.volumeUsd,
    })
  }
  return map
}

// Batched fetch of per-issuer price (GetTokens) plus market cap and 1-day volume (GetTokenMarkets).
export function useRWAIssuerMarketData(tokens: RWAToken[]): (token: RWAToken) => RWAIssuerMarketData {
  const restContracts = useMemo<RestContract[]>(
    () => tokens.map(({ chainId, address }) => ({ chainId, address })),
    [tokens],
  )
  const hasTokens = restContracts.length > 0

  const { data: tokensData } = useQuery(
    getGetTokensQueryOptions({ params: hasTokens ? { tokens: restContracts } : undefined }),
  )
  const { data: marketsData } = useQuery(
    getGetTokenMarketsQueryOptions({
      params: hasTokens ? { tokens: restContracts, duration: HistoryDuration.DAY } : undefined,
    }),
  )

  const marketDataByKey = useMemo(
    () => buildRWAIssuerMarketDataMap({ tokens: tokensData?.tokens ?? [], markets: marketsData?.markets ?? [] }),
    [tokensData, marketsData],
  )

  return useMemo(() => (token: RWAToken) => marketDataByKey.get(rwaTokenMarketDataKey(token)) ?? {}, [marketDataByKey])
}

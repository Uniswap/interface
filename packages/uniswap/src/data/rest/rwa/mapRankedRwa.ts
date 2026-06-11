import type { ListRankedRwasResponse, RankedRwa, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapIssuerMultichainToken, mapRwaSparkline } from 'uniswap/src/data/rest/rwa/rwaMappingUtils'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'

export function mapRankedRwa({ token, category }: { token: RankedRwa; category: RwaCategory }): Rwa | null {
  if (!token.symbol) {
    return null
  }

  const issuerTokens = token.issuerTokens
    .map((issuer) => mapIssuerMultichainToken({ issuer, parentLogoUrl: token.logoUrl, requireIssuerName: true }))
    .filter((issuer): issuer is IssuerToken => issuer !== null)

  if (issuerTokens.length === 0) {
    return null
  }

  return {
    symbol: token.symbol,
    name: token.name,
    logoUrl: token.logoUrl,
    priceUsd: token.priceUsd,
    priceChange1hPct: token.priceChange1hPct,
    priceChange24hPct: token.priceChange24hPct,
    marketCapUsd: token.marketCapUsd,
    volume24hUsd: token.volume24hUsd,
    sparkline1d: mapRwaSparkline(token.sparkline1d),
    issuerTokens,
    // Stamp the request category: ListRankedRwas is queried per-category and its rows carry none.
    categories: [category],
  }
}

export function mapRankedRwaList({
  response,
  category,
}: {
  response?: ListRankedRwasResponse
  category: RwaCategory
}): Rwa[] {
  return (response?.rwas ?? [])
    .map((token) => mapRankedRwa({ token, category }))
    .filter((rwa): rwa is Rwa => rwa !== null)
}

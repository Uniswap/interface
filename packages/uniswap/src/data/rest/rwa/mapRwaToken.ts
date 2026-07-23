import type { IssuerMultichainToken, ListRwaTokensResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapIssuerMultichainToken, mapRwaSparkline } from 'uniswap/src/data/rest/rwa/rwaMappingUtils'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'

/** Maps a flat ListRwaTokens entry to a single-issuer Rwa row for the Explore table. */
export function mapRwaToken(token: IssuerMultichainToken): Rwa | null {
  const issuerToken = mapIssuerMultichainToken({ issuer: token, parentLogoUrl: token.logoUrl })
  if (!issuerToken) {
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
    issuerTokens: [issuerToken],
  }
}

export function mapRwaTokenList(response?: ListRwaTokensResponse): Rwa[] {
  return (response?.tokens ?? []).map(mapRwaToken).filter((rwa): rwa is Rwa => rwa !== null)
}

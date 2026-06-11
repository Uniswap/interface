import type { IssuerToken, Rwa, RwaAggregatedMetrics } from 'uniswap/src/data/rest/rwa/types'

export function deriveRwaAggregates(rwa: Rwa): RwaAggregatedMetrics {
  const primaryIssuer = rwa.issuerTokens[0]
  const marketCapUsd = rwa.issuerTokens.reduce((sum, issuer) => sum + (issuer.marketCapUsd ?? 0), 0)
  const volume24hUsd = rwa.issuerTokens.reduce((sum, issuer) => sum + issuer.volume24hUsd, 0)

  if (!primaryIssuer) {
    return {
      priceUsd: rwa.priceUsd,
      priceChange1hPct: rwa.priceChange1hPct,
      priceChange24hPct: rwa.priceChange24hPct,
      marketCapUsd: marketCapUsd || rwa.marketCapUsd,
      volume24hUsd: volume24hUsd || rwa.volume24hUsd,
      sparkline1d: rwa.sparkline1d,
    }
  }

  return {
    priceUsd: primaryIssuer.priceUsd,
    priceChange1hPct: primaryIssuer.priceChange1hPct,
    priceChange24hPct: primaryIssuer.priceChange24hPct,
    marketCapUsd,
    volume24hUsd,
    sparkline1d: primaryIssuer.sparkline1d,
  }
}

export function getIssuerCount(rwa: Rwa): number {
  return rwa.issuerTokens.length
}

export function getNetworkCount(issuer: IssuerToken): number {
  return issuer.chainTokens.length
}

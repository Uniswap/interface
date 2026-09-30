import type { IssuerToken, Rwa, RwaAggregatedMetrics } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'

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

/** `ListRwas`-built issuers with no ranked match carry zeroed metrics, so a zero price means "no data". */
export function hasIssuerMetrics(issuer: IssuerToken): boolean {
  return issuer.priceUsd > 0
}

export function getIssuerCount(rwa: Rwa): number {
  return rwa.issuerTokens.length
}

/**
 * Grouping payloads carry the issuer's full chainTokens list regardless of the request's chain
 * scoping, so the "N networks" figure must be gated client-side on the enabled/allowed chain set
 * (same convention as the Explore tokens table's getAllowedAddressChainIds).
 */
export function getNetworkCount(issuer: IssuerToken, enabledChainIds: readonly number[]): number {
  const enabled = new Set(enabledChainIds)
  return issuer.chainTokens.filter((chainToken) => enabled.has(chainToken.chainId)).length
}

/** Distinct enabled networks across every issuer of a grouped RWA (two issuers on Base count once). */
export function getRwaNetworkCount(rwa: Rwa, enabledChainIds: readonly number[]): number {
  const enabled = new Set(enabledChainIds)
  const chainIds = new Set<number>()
  for (const issuer of rwa.issuerTokens) {
    for (const chainToken of issuer.chainTokens) {
      if (enabled.has(chainToken.chainId)) {
        chainIds.add(chainToken.chainId)
      }
    }
  }
  return chainIds.size
}

export type RwaPriceDisplay =
  | { kind: 'single'; priceUsd: number }
  | {
      kind: 'range'
      priceUsd: number
      minPriceUsd: number
      maxPriceUsd: number
      priceDeviationPct: number
    }

export function getIssuerPriceDisplay(issuer: IssuerToken): RwaPriceDisplay {
  return { kind: 'single', priceUsd: issuer.priceUsd }
}

export function getRwaPriceDisplay(rwa: Rwa): RwaPriceDisplay {
  if (rwa.priceDeviationPct !== undefined && rwa.priceDeviationPct > 0 && rwa.issuerTokens.length > 1) {
    const prices = rwa.issuerTokens.map((issuer) => issuer.priceUsd)
    return {
      kind: 'range',
      priceUsd: rwa.priceUsd,
      minPriceUsd: Math.min(...prices),
      maxPriceUsd: Math.max(...prices),
      priceDeviationPct: rwa.priceDeviationPct,
    }
  }

  return { kind: 'single', priceUsd: rwa.priceUsd }
}

/** Sort key for ranked parent rows: minimum price when a range applies. */
export function getRwaPriceSortValue(rwa: Rwa): number {
  const display = getRwaPriceDisplay(rwa)
  return display.kind === 'range' ? display.minPriceUsd : display.priceUsd
}

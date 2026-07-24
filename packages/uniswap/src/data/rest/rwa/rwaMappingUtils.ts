import type {
  IssuerMultichainToken,
  RwaChainToken,
  RwaSparkline as ApiRwaSparkline,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  PREFERRED_RWA_CHAIN_ID,
  type ChainToken,
  type IssuerToken,
  type RwaSparkline,
} from 'uniswap/src/data/rest/rwa/types'

export function mapRwaSparkline(sparkline?: ApiRwaSparkline): RwaSparkline {
  return {
    points: (sparkline?.points ?? []).map((point) => ({
      timestampS: Number(point.timestampS),
      value: point.value,
    })),
  }
}

export function mapRwaChainToken(chainToken: RwaChainToken): ChainToken {
  return {
    chainId: chainToken.chainId,
    address: chainToken.address,
  }
}

/** Mainnet-first, then ascending chainId — matches search path ordering. */
export function sortRwaChainTokens(chainTokens: readonly RwaChainToken[]): ChainToken[] {
  return chainTokens
    .filter((chainToken) => chainToken.address)
    .map(mapRwaChainToken)
    .sort(
      (a, b) =>
        Number(b.chainId === PREFERRED_RWA_CHAIN_ID) - Number(a.chainId === PREFERRED_RWA_CHAIN_ID) ||
        a.chainId - b.chainId,
    )
}

interface MapIssuerMultichainTokenParams {
  issuer: IssuerMultichainToken
  parentLogoUrl: string
  requireIssuerName?: boolean
}

export function mapIssuerMultichainToken({
  issuer,
  parentLogoUrl,
  requireIssuerName,
}: MapIssuerMultichainTokenParams): IssuerToken | null {
  if (!issuer.symbol) {
    return null
  }

  if (requireIssuerName && !issuer.issuer) {
    return null
  }

  const chainTokens = sortRwaChainTokens(issuer.chainTokens)
  if (chainTokens.length === 0) {
    return null
  }

  return {
    symbol: issuer.symbol,
    name: issuer.name,
    logoUrl: issuer.logoUrl || parentLogoUrl,
    issuer: issuer.issuer,
    priceUsd: issuer.priceUsd,
    priceChange1hPct: issuer.priceChange1hPct,
    priceChange24hPct: issuer.priceChange24hPct,
    marketCapUsd: issuer.marketCapUsd,
    volume24hUsd: issuer.volume24hUsd,
    sparkline1d: mapRwaSparkline(issuer.sparkline1d),
    chainTokens,
  }
}

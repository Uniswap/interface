import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { rwaChainAddressKey } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

export type RwaIssuerMetrics = Pick<IssuerToken, 'priceUsd' | 'priceChange24hPct' | 'fdvUsd' | 'volume24hUsd'>

export type RwaIssuerMetricsIndex = Map<string, RwaIssuerMetrics>

/** Indexes ranked issuer metrics by chain deployment, so ListRwas issuers are matched by address, not slug. */
export function buildRwaIssuerMetricsIndex(rwas: readonly Rwa[]): RwaIssuerMetricsIndex {
  const index: RwaIssuerMetricsIndex = new Map()
  for (const rwa of rwas) {
    for (const issuer of rwa.issuerTokens) {
      const metrics: RwaIssuerMetrics = {
        priceUsd: issuer.priceUsd,
        priceChange24hPct: issuer.priceChange24hPct,
        fdvUsd: issuer.fdvUsd,
        volume24hUsd: issuer.volume24hUsd,
      }
      for (const chainToken of issuer.chainTokens) {
        index.set(rwaChainAddressKey(chainToken.chainId, chainToken.address), metrics)
      }
    }
  }
  return index
}

/** Fills issuer metrics from the index (first matching deployment wins). Never mutates the shared index entry. */
export function withRwaIssuerMetrics({ rwa, metricsIndex }: { rwa: Rwa; metricsIndex: RwaIssuerMetricsIndex }): Rwa {
  return {
    ...rwa,
    issuerTokens: rwa.issuerTokens.map((issuer) => {
      for (const chainToken of issuer.chainTokens) {
        const metrics = metricsIndex.get(rwaChainAddressKey(chainToken.chainId, chainToken.address))
        if (metrics) {
          return { ...issuer, ...metrics }
        }
      }
      return issuer
    }),
  }
}

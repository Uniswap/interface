import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'

export type RwaSparklinePoint = {
  timestampS: number
  value: number
}

export type RwaSparkline = {
  points: RwaSparklinePoint[]
}

export type ChainToken = {
  chainId: number
  address: string
}

export type IssuerToken = {
  symbol: string
  name: string
  logoUrl: string
  issuer: string
  priceUsd: number
  priceChange1hPct?: number
  priceChange24hPct?: number
  marketCapUsd?: number
  volume24hUsd: number
  sparkline1d: RwaSparkline
  chainTokens: ChainToken[]
}

/** Grouped real-world asset (e.g. Tesla) with per-issuer breakdown from ListRankedRwas. */
export type Rwa = {
  symbol: string
  name: string
  logoUrl: string
  priceUsd: number
  priceChange1hPct?: number
  priceChange24hPct?: number
  marketCapUsd?: number
  volume24hUsd: number
  sparkline1d: RwaSparkline
  /** Max % deviation across issuer prices from parent priceUsd; ranked API only. */
  priceDeviationPct?: number
  /** Ordered by liquidity (highest first per API contract). */
  issuerTokens: IssuerToken[]
  /** Per-asset RWA categories from the `ListRwas` endpoint (pre-sorted by the backend's display order), or the
   *  request category stamped onto ranked rows. The tag uses the first entry (see `getRwaTagCategory`). */
  categories?: RwaCategory[]
}

export type RwaAggregatedMetrics = {
  priceUsd: number
  priceChange1hPct?: number
  priceChange24hPct?: number
  marketCapUsd?: number
  volume24hUsd: number
  sparkline1d: RwaSparkline
}

export type ExploreStockShelfItem = {
  rwa: Rwa
  issuer: IssuerToken
}

/** Mainnet — the preferred chain when an RWA issuer exists on multiple chains (nav target + collection key). */
export const PREFERRED_RWA_CHAIN_ID = 1

/**
 * Structural subset of a `ListRwas` asset entry, shared by the whitelist (`useRWAWhitelist`) and the search
 * grouping (`rwaSearchGrouping`). `ListRwas` issuerTokens are FLAT (one entry per chain) — distinct from
 * `ListRankedRwas`, whose issuerTokens are nested (`mapRankedRwa`).
 */
export type ListRwasIssuerData = { name: string; symbol: string; logoUrl: string }
export type ListRwasTokenSource = { chainId: number; address: string; issuer: string }
export type ListRwasAssetSource = {
  symbol: string
  name: string
  logoUrl: string
  categories?: RwaCategory[]
  issuerTokens: ListRwasTokenSource[]
  issuerData: Record<string, ListRwasIssuerData>
}

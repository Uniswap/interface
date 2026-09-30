import { normalizeTokenAddressForCache } from '@universe/chains'
import { OnchainItemListOptionType, type RwaCollectionOption } from 'uniswap/src/components/lists/items/types'
import { resolveRwaIssuerDisplay } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolveRwaIssuerDisplay'
import {
  PREFERRED_RWA_CHAIN_ID,
  type IssuerToken,
  type ListRwasAssetSource,
  type Rwa,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import type { SearchTokenStats } from 'uniswap/src/features/dataApi/types'
import { getExpandableSearchRowHeightPx } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'

export type RwaSearchIndexEntry = { rwa: Rwa; issuer: IssuerToken }
export type RwaSearchIndex = { rwas: Rwa[]; byChainAddress: Map<string, RwaSearchIndexEntry> }

const EMPTY_SPARKLINE = { points: [] }

export function rwaChainAddressKey(chainId: number, address: string): string {
  return `${chainId}:${normalizeTokenAddressForCache(address)}`
}

/** Builds a canonical `Rwa` from a `ListRwas` asset. Metric fields are zeroed ("no data", see hasIssuerMetrics);
 *  search fills them from the ranked list via withRwaIssuerMetrics. */
export function buildRwaFromListRwasAsset(asset: ListRwasAssetSource): Rwa | undefined {
  if (!asset.symbol) {
    return undefined
  }

  const issuerBySlug = new Map<string, IssuerToken>()
  for (const token of asset.issuerTokens) {
    if (!token.chainId || !token.address) {
      continue
    }
    const data = resolveRwaIssuerDisplay({ asset, token })
    if (!data) {
      continue
    }
    let issuer = issuerBySlug.get(token.issuer)
    if (!issuer) {
      issuer = {
        symbol: data.symbol,
        name: data.name,
        logoUrl: data.logoUrl,
        issuer: token.issuer,
        priceUsd: 0,
        volume24hUsd: 0,
        sparkline1d: EMPTY_SPARKLINE,
        chainTokens: [],
      }
      issuerBySlug.set(token.issuer, issuer)
    }
    issuer.chainTokens.push({ chainId: token.chainId, address: token.address })
  }

  // Issuer order follows the ListRwas whitelist (first-appearance of each issuer slug), treated as the intended
  // display order — the whitelist is curated and carries no per-issuer volume to rank by.
  const issuerTokens = Array.from(issuerBySlug.values())
  if (!issuerTokens.length) {
    return undefined
  }
  // Sort each issuer's chains mainnet-first, then by ascending chainId, so chainTokens[0] is a deterministic
  // navigation target (the secondary key makes the order total among non-mainnet chains).
  for (const issuer of issuerTokens) {
    issuer.chainTokens.sort(
      (a, b) =>
        Number(b.chainId === PREFERRED_RWA_CHAIN_ID) - Number(a.chainId === PREFERRED_RWA_CHAIN_ID) ||
        a.chainId - b.chainId,
    )
  }

  return {
    symbol: asset.symbol,
    name: asset.name,
    logoUrl: asset.logoUrl,
    categories: asset.categories,
    priceUsd: 0,
    volume24hUsd: 0,
    sparkline1d: EMPTY_SPARKLINE,
    issuerTokens,
  }
}

export function buildRwaSearchIndex(assets: ListRwasAssetSource[]): RwaSearchIndex {
  const rwas: Rwa[] = []
  const byChainAddress = new Map<string, RwaSearchIndexEntry>()
  for (const asset of assets) {
    const rwa = buildRwaFromListRwasAsset(asset)
    if (!rwa) {
      continue
    }
    rwas.push(rwa)
    for (const issuer of rwa.issuerTokens) {
      for (const chainToken of issuer.chainTokens) {
        byChainAddress.set(rwaChainAddressKey(chainToken.chainId, chainToken.address), { rwa, issuer })
      }
    }
  }
  return { rwas, byChainAddress }
}

export function findRwaForToken(
  index: RwaSearchIndex,
  token: { chainId?: number | null; address?: string | null },
): RwaSearchIndexEntry | undefined {
  if (!token.chainId || !token.address) {
    return undefined
  }
  return index.byChainAddress.get(rwaChainAddressKey(token.chainId, token.address))
}

/** Lowest-priced entry's price + 24h change and the summed 1d volume; undefined when nothing contributes. Zeros
 *  mean "no data" (zeroed `ListRwas` metrics, unpriced tokens), so they never become a "from $0.00" floor. */
export function aggregateRwaCollectionStats(statsList: SearchTokenStats[]): SearchTokenStats | undefined {
  const priced = statsList.filter(
    (stats): stats is SearchTokenStats & { priceUsd: number } => (stats.priceUsd ?? 0) > 0,
  )
  const lowest = priced.reduce<(typeof priced)[number] | undefined>(
    (min, stats) => (!min || stats.priceUsd < min.priceUsd ? stats : min),
    undefined,
  )
  const volumes = statsList.map((stats) => stats.volume1dUsd ?? 0).filter((volume) => volume > 0)
  if (!lowest && !volumes.length) {
    return undefined
  }
  return {
    ...(lowest && { priceUsd: lowest.priceUsd, pricePercentChange1d: lowest.pricePercentChange1d }),
    ...(volumes.length && { volume1dUsd: volumes.reduce((sum, volume) => sum + volume, 0) }),
  }
}

export function getRwaCollectionSearchStats(rwa: Rwa): SearchTokenStats | undefined {
  return aggregateRwaCollectionStats(
    rwa.issuerTokens.map((issuer) => ({
      priceUsd: issuer.priceUsd,
      pricePercentChange1d: issuer.priceChange24hPct,
      volume1dUsd: issuer.volume24hUsd,
    })),
  )
}

export function buildRwaCollectionOption({
  rwa,
  showCategoryTag,
  searchStats,
}: {
  rwa: Rwa
  showCategoryTag: boolean
  searchStats?: SearchTokenStats
}): RwaCollectionOption {
  const issuerCount = rwa.issuerTokens.length
  return {
    type: OnchainItemListOptionType.RwaCollection,
    rwa,
    showCategoryTag,
    ...(searchStats && { searchStats }),
    rowLayout: {
      dynamicHeight: issuerCount > 1,
      collapsedHeightPx: getExpandableSearchRowHeightPx({ issuerCount, expanded: false }),
      expandedHeightPx: getExpandableSearchRowHeightPx({ issuerCount, expanded: true }),
    },
  }
}

/**
 * Stable identity for an RWA collection row (react/measurement key, expand-state key, dedup key) — NOT a nav
 * target. Anchors on the min issuer slug, not `issuerTokens[0]` (whose order follows the API), so a refetch that
 * reorders issuers can't change a row's identity; `chainTokens[0]` is mainnet-first-sorted on both build paths.
 * `symbol` disambiguates a shared anchor address; falls back to symbol alone when there are no chainTokens.
 */
export function getRwaCollectionKey({ rwa }: { rwa: Rwa }): string {
  const anchorIssuer = rwa.issuerTokens.reduce<IssuerToken | undefined>(
    (min, issuer) => (!min || issuer.issuer < min.issuer ? issuer : min),
    undefined,
  )
  const primary = anchorIssuer?.chainTokens[0]
  return primary ? `rwa-collection-${rwa.symbol}-${primary.chainId}:${primary.address}` : `rwa-collection-${rwa.symbol}`
}

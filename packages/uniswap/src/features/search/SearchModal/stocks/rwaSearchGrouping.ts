import { OnchainItemListOptionType, type RwaCollectionOption } from 'uniswap/src/components/lists/items/types'
import {
  PREFERRED_RWA_CHAIN_ID,
  type IssuerToken,
  type ListRwasAssetSource,
  type Rwa,
} from 'uniswap/src/data/rest/rwa/types'
import { getExpandableSearchRowHeightPx } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { normalizeRWAAddress } from 'uniswap/src/features/rwa/rwaMatch'
import { logger } from 'utilities/src/logger/logger'

export type RwaSearchIndexEntry = { rwa: Rwa; issuer: IssuerToken }
export type RwaSearchIndex = { rwas: Rwa[]; byChainAddress: Map<string, RwaSearchIndexEntry> }

const EMPTY_SPARKLINE = { points: [] }

function indexKey(chainId: number, address: string): string {
  return `${chainId}:${normalizeRWAAddress(address)}`
}

/** Builds a canonical `Rwa` from a `ListRwas` asset. Metric fields are zeroed: the search/identity
 *  render path (ExpandableParentAssetIdentity / ExpandableIssuerIdentity) never reads price/volume. */
export function buildRwaFromListRwasAsset(asset: ListRwasAssetSource): Rwa | undefined {
  if (!asset.symbol) {
    return undefined
  }

  const issuerBySlug = new Map<string, IssuerToken>()
  for (const token of asset.issuerTokens) {
    if (!token.chainId || !token.address) {
      continue
    }
    const data = asset.issuerData[token.issuer]
    if (!data) {
      // The data-api contract guarantees an issuerData entry for every issuer in issuerTokens; if one is missing
      // we can't render the issuer, so report it (matching the whitelist path) and drop it.
      logger.error(new Error('RWA issuer token is missing its issuerData entry'), {
        tags: { file: 'rwaSearchGrouping.ts', function: 'buildRwaFromListRwasAsset' },
        extra: { issuer: token.issuer, chainId: token.chainId, address: token.address },
      })
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
        byChainAddress.set(indexKey(chainToken.chainId, chainToken.address), { rwa, issuer })
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
  return index.byChainAddress.get(indexKey(token.chainId, token.address))
}

export function buildRwaCollectionOption({
  rwa,
  showCategoryTag,
  showTokenCount,
}: {
  rwa: Rwa
  showCategoryTag: boolean
  showTokenCount: boolean
}): RwaCollectionOption {
  const issuerCount = rwa.issuerTokens.length
  return {
    type: OnchainItemListOptionType.RwaCollection,
    rwa,
    showCategoryTag,
    showTokenCount,
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

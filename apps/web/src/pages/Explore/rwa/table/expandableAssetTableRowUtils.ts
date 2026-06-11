import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import { deriveRwaAggregates } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'

export type ExpandableAssetTableRow =
  | { type: 'parent'; asset: Rwa; subRows?: ExpandableAssetTableRow[]; link?: string }
  | { type: 'issuer'; asset: Rwa; issuer: IssuerToken; link?: string }

export function linkForIssuer(issuer: IssuerToken, enabledChainIds: readonly UniverseChainId[]): string | undefined {
  const primary = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  if (!primary?.address) {
    return undefined
  }
  return getTokenDetailsURL({ address: primary.address, chain: toGraphQLChain(primary.chainId) })
}

export function buildExpandableAssetTableRows(
  assets: Rwa[],
  enabledChainIds: readonly UniverseChainId[],
): ExpandableAssetTableRow[] {
  return assets.map((asset): ExpandableAssetTableRow => {
    const hasMultipleIssuers = asset.issuerTokens.length > 1
    const subRows: ExpandableAssetTableRow[] | undefined = hasMultipleIssuers
      ? asset.issuerTokens.map((issuer) => ({
          type: 'issuer',
          asset,
          issuer,
          link: linkForIssuer(issuer, enabledChainIds),
        }))
      : undefined
    return {
      type: 'parent',
      asset,
      subRows,
      link: hasMultipleIssuers ? undefined : linkForIssuer(asset.issuerTokens[0], enabledChainIds),
    }
  })
}

export function getExpandableAssetTableRowId(row: ExpandableAssetTableRow): string {
  if (row.type === 'parent') {
    const primary = row.asset.issuerTokens[0]
    const chain = primary.chainTokens[0]
    const chainKey = `${chain.chainId}-${chain.address.toLowerCase()}`
    return `asset-${row.asset.symbol}-${chainKey}`
  }
  const chain = row.issuer.chainTokens[0]
  const chainKey = `${chain.chainId}-${chain.address.toLowerCase()}`
  return `asset-${row.asset.symbol}-issuer-${row.issuer.issuer}-${chainKey}`
}

export function getExpandableAssetSubRows(row: ExpandableAssetTableRow): ExpandableAssetTableRow[] | undefined {
  if (row.type !== 'parent') {
    return undefined
  }
  return row.subRows
}

export function expandableAssetRowHasMultipleIssuers(row: ExpandableAssetTableRow): boolean {
  return row.type === 'parent' && (row.subRows?.length ?? 0) > 0
}

export type ExpandableAssetRowMetrics = {
  priceUsd: number
  priceChange1hPct?: number
  priceChange24hPct?: number
  marketCapUsd?: number
  volume24hUsd: number
  sparkline: Rwa['sparkline1d']
}

export function getExpandableAssetRowMetrics(row: ExpandableAssetTableRow): ExpandableAssetRowMetrics {
  if (row.type === 'parent') {
    const aggregates = deriveRwaAggregates(row.asset)
    return {
      priceUsd: aggregates.priceUsd,
      priceChange1hPct: aggregates.priceChange1hPct,
      priceChange24hPct: aggregates.priceChange24hPct,
      marketCapUsd: aggregates.marketCapUsd,
      volume24hUsd: aggregates.volume24hUsd,
      sparkline: aggregates.sparkline1d,
    }
  }
  return {
    priceUsd: row.issuer.priceUsd,
    priceChange1hPct: row.issuer.priceChange1hPct,
    priceChange24hPct: row.issuer.priceChange24hPct,
    marketCapUsd: row.issuer.marketCapUsd,
    volume24hUsd: row.issuer.volume24hUsd,
    sparkline: row.issuer.sparkline1d,
  }
}

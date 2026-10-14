import { normalizeTokenAddressForCache, UniverseChainId } from '@universe/chains'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import {
  deriveRwaAggregates,
  getIssuerPriceDisplay,
  getRwaPriceDisplay,
  type RwaPriceDisplay,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getTokenDetailsURL } from '~/data/util'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

/** `rank` is the 1-based Explore position; only top-level rows carry it, issuer sub-rows stay unranked. */
type RowAnalytics = { elementName: ElementName; properties: Record<string, unknown> }

export type ExpandableAssetTableRow =
  | {
      type: 'parent'
      asset: Rwa
      subRows?: ExpandableAssetTableRow[]
      link?: string
      rank?: number
      analytics?: RowAnalytics
    }
  | {
      type: 'issuer'
      asset: Rwa
      issuer: IssuerToken
      link?: string
      rank?: number
      analytics?: RowAnalytics
    }

/**
 * @param chainFilter the active Explore network filter (e.g. `/explore/tokens/arbitrum`), if any. When present the
 * row link stays scoped to that network; otherwise it opens the aggregate multichain TDP, matching the stocks
 * shelf cards (see `ShelfTokenCard`).
 */
export function linkForIssuer({
  issuer,
  enabledChainIds,
  chainFilter,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
}): string | undefined {
  const primary = resolvePrimaryChain({ issuer, enabledChainIds, chainFilter })
  if (!primary) {
    return undefined
  }
  return getTokenDetailsURL({
    address: primary.chainToken.address,
    chain: toGraphQLChain(primary.chainId),
    chainQueryParam: chainFilter ? undefined : TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
  })
}

function buildIssuerRow({
  asset,
  issuer,
  enabledChainIds,
  chainFilter,
  rank,
  assetRank,
  categoryId,
}: {
  asset: Rwa
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
  rank?: number
  assetRank?: number
  categoryId?: string
}): ExpandableAssetTableRow {
  const primary = resolvePrimaryChain({ issuer, enabledChainIds, chainFilter })
  return {
    type: 'issuer',
    asset,
    issuer,
    link: linkForIssuer({ issuer, enabledChainIds, chainFilter }),
    rank,
    analytics: {
      elementName: ElementName.TokensTableRow,
      properties: {
        token_address: primary?.chainToken.address,
        chain_id: primary?.chainId,
        token_symbol: issuer.symbol,
        issuer: issuer.issuer,
        token_list_rank: assetRank,
        category_id: categoryId,
      },
    },
  }
}

export function buildExpandableAssetTableRows({
  assets,
  enabledChainIds,
  chainFilter,
  rankByAsset,
  categoryId,
}: {
  assets: Rwa[]
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
  rankByAsset?: ReadonlyMap<Rwa, number>
  categoryId?: string
}): ExpandableAssetTableRow[] {
  return assets.flatMap((asset): ExpandableAssetTableRow[] => {
    const rank = rankByAsset?.get(asset)
    const soleIssuer = asset.issuerTokens.length === 1 ? asset.issuerTokens[0] : undefined
    if (soleIssuer) {
      return [
        buildIssuerRow({
          asset,
          issuer: soleIssuer,
          enabledChainIds,
          chainFilter,
          rank,
          assetRank: rank,
          categoryId,
        }),
      ]
    }

    const subRows = asset.issuerTokens.map((issuer) =>
      buildIssuerRow({ asset, issuer, enabledChainIds, chainFilter, assetRank: rank, categoryId }),
    )

    return [
      {
        type: 'parent',
        asset,
        subRows,
        rank,
        analytics: {
          elementName: ElementName.TokensTableGroupRow,
          properties: {
            token_symbol: asset.symbol,
            token_list_rank: rank,
            category_id: categoryId,
          },
        },
      },
    ]
  })
}

export function getExpandableAssetTableRowId(row: ExpandableAssetTableRow): string {
  if (row.type === 'parent') {
    const primary = row.asset.issuerTokens[0]
    const chain = primary.chainTokens[0]
    const chainKey = `${chain.chainId}-${normalizeTokenAddressForCache(chain.address)}`
    return `asset-${row.asset.symbol}-${chainKey}`
  }
  const chain = row.issuer.chainTokens[0]
  const chainKey = `${chain.chainId}-${normalizeTokenAddressForCache(chain.address)}`
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

export function getExpandableAssetRowPriceDisplay(row: ExpandableAssetTableRow): RwaPriceDisplay {
  if (row.type === 'parent') {
    return getRwaPriceDisplay(row.asset)
  }
  return getIssuerPriceDisplay(row.issuer)
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

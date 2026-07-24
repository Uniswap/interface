import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import {
  deriveRwaAggregates,
  getIssuerPriceDisplay,
  getRwaPriceDisplay,
  type RwaPriceDisplay,
} from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getTokenDetailsURL } from '~/appGraphql/data/util'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export type ExpandableAssetTableRow =
  | { type: 'parent'; asset: Rwa; subRows?: ExpandableAssetTableRow[]; link?: string }
  | { type: 'issuer'; asset: Rwa; issuer: IssuerToken; link?: string }

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
  const primary = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  if (!primary?.address) {
    return undefined
  }
  return getTokenDetailsURL({
    address: primary.address,
    chain: toGraphQLChain(primary.chainId),
    chainQueryParam: chainFilter ? undefined : TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
  })
}

export function buildExpandableAssetTableRows({
  assets,
  enabledChainIds,
  chainFilter,
}: {
  assets: Rwa[]
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
}): ExpandableAssetTableRow[] {
  return assets.flatMap((asset): ExpandableAssetTableRow[] => {
    const soleIssuer = asset.issuerTokens.length === 1 ? asset.issuerTokens[0] : undefined
    if (soleIssuer) {
      return [
        {
          type: 'issuer',
          asset,
          issuer: soleIssuer,
          link: linkForIssuer({ issuer: soleIssuer, enabledChainIds, chainFilter }),
        },
      ]
    }

    const subRows = asset.issuerTokens.map((issuer) => ({
      type: 'issuer' as const,
      asset,
      issuer,
      link: linkForIssuer({ issuer, enabledChainIds, chainFilter }),
    }))

    return [
      {
        type: 'parent',
        asset,
        subRows,
      },
    ]
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

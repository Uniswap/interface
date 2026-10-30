import type { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

/** Which taxonomy a category belongs to. Ids are unique across kinds; the kind picks the route and the stats shape. */
export type CategoryKind = 'token' | 'pool'

export enum TokenCategoryClass {
  Market = 'market',
  Asset = 'asset',
  Sector = 'sector',
}

export interface TokenCategoryTopToken {
  chainId: number
  address: string
  symbol: string
  logoUrl: string
}

/** A grouped category's row: one underlying asset (TSLA) across its issuers' tokens. */
export interface TokenCategoryTopGroup {
  /** Frozen slug ('tsla'), stable across display-name changes. */
  id: string
  displayName: string
  ticker: string
  logoUrl: string
}

/** One token logo in a category pile; see `getCategoryPileLogos`. */
export interface TokenCategoryPileLogo {
  key: string
  name: string
  symbol: string
  logoUrl: string
}

/** One pool in a category pile, drawn as a split pair circle like a pool row's logo. */
export interface PoolCategoryPileLogo {
  key: string
  token0: TokenCategoryPileLogo
  token1: TokenCategoryPileLogo
}

export type CategoryPileLogo = TokenCategoryPileLogo | PoolCategoryPileLogo

export function isPoolCategoryPileLogo(logo: CategoryPileLogo): logo is PoolCategoryPileLogo {
  return 'token0' in logo
}

export interface TokenCategoryDefaultSort {
  orderBy: TokensOrderBy
  ascending: boolean
}

export interface TokenCategoryStats {
  tokenCount: number
  priceChange24hPct: number
  volume1h: number
  volume1d: number
  volume1w: number
  volume1m: number
  volume1y: number
  fdv?: number
  marketCap?: number
}

/** Identity + copy shared by every kind; the kind-specific stats and top members live on the subtypes. */
export interface CategoryBase {
  id: string
  kind: CategoryKind
  /** Display name, localized by `localizeCategory`; the mapper fills it with `englishName`. */
  name: string
  /** Kept alongside the localized name because BE Search matches English names only. */
  englishName: string
  description: string
  /** Keyed by BCP-47 tag (es-ES, zh-Hant, ...). English is never a key; absent when untranslated. */
  nameTranslations?: Record<string, string>
  descriptionTranslations?: Record<string, string>
  categoryClass: TokenCategoryClass
}

export interface TokenCategory extends CategoryBase {
  kind: 'token'
  /** BE-declared: rows group by underlying asset with issuers beneath (Stocks/ETFs) rather than one row per token. */
  grouped: boolean
  defaultSort?: TokenCategoryDefaultSort
  stats?: TokenCategoryStats
  topTokens: TokenCategoryTopToken[]
  /**
   * A grouped category's first page rows, empty for the others. Piles show these over topTokens:
   * a grouped category's top tokens are its most traded products, which can all be one issuer's
   * and share a logo.
   */
  topGroups: TokenCategoryTopGroup[]
}

export interface TokenCategoryDetail {
  category: TokenCategory
  /** Timestamps in ms epoch. Served when the request sets include_charts. */
  volumeSeries: ChartPoint[]
  fdvSeries: ChartPoint[]
}

export interface PoolCategoryTopPool {
  chainId: number
  poolId: string
  token0Symbol: string
  token0LogoUrl: string
  token1Symbol: string
  token1LogoUrl: string
  protocolVersion: ProtocolVersion
  feeTier?: number
}

export interface PoolCategoryStats {
  poolCount: number
  tvl: number
  volume1d: number
  volume1w: number
  volume1m: number
  fees1d: number
  tvlChange24hPct?: number
  volumeChange24hPct?: number
  /** TVL-weighted across member pools. */
  avgApr?: number
}

export interface PoolCategory extends CategoryBase {
  kind: 'pool'
  stats?: PoolCategoryStats
  topPools: PoolCategoryTopPool[]
}

export interface PoolCategoryDetail {
  category: PoolCategory
  /** Timestamps in ms epoch. Served when the request sets include_charts. */
  volumeSeries: ChartPoint[]
  tvlSeries: ChartPoint[]
  feesSeries: ChartPoint[]
}

export type Category = TokenCategory | PoolCategory

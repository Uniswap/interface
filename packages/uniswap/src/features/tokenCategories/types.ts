import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'

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

/** One logo in a category pile; see `getCategoryPileLogos`. */
export interface TokenCategoryPileLogo {
  key: string
  name: string
  symbol: string
  logoUrl: string
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

export interface TokenCategory {
  id: string
  /** Display name, localized by `localizeTokenCategory`; the mapper fills it with `englishName`. */
  name: string
  /** Kept alongside the localized name because BE Search matches English names only. */
  englishName: string
  description: string
  /** Keyed by BCP-47 tag (es-ES, zh-Hant, ...). English is never a key; absent when untranslated. */
  nameTranslations?: Record<string, string>
  descriptionTranslations?: Record<string, string>
  categoryClass: TokenCategoryClass
  /** BE-declared: rows group by underlying asset with issuers beneath (Stocks/ETFs) rather than one row per token. */
  grouped: boolean
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

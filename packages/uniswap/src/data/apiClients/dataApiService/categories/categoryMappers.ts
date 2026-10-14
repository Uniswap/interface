import {
  CategoryClass,
  type RankedCategory,
  type TimeSeriesPoint,
} from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import type { Language } from 'uniswap/src/features/language/constants'
import { getTranslation } from 'uniswap/src/features/language/getTranslation'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'
import { logger } from 'utilities/src/logger/logger'

const CATEGORY_CLASS_BY_PROTO: Partial<Record<CategoryClass, TokenCategoryClass>> = {
  [CategoryClass.MARKET]: TokenCategoryClass.Market,
  [CategoryClass.ASSET]: TokenCategoryClass.Asset,
  [CategoryClass.SECTOR]: TokenCategoryClass.Sector,
}

export function rankedCategoryToTokenCategory(ranked: RankedCategory): TokenCategory | undefined {
  const category = ranked.category
  const categoryClass = category && CATEGORY_CLASS_BY_PROTO[category.class]
  if (!category || !categoryClass) {
    if (category) {
      logger.warn('categoryMappers', 'rankedCategoryToTokenCategory', 'Dropping category with unmapped class', {
        id: category.id,
        class: category.class,
      })
    }
    return undefined
  }

  return {
    id: category.id,
    name: category.name,
    englishName: category.name,
    description: category.description,
    nameTranslations: category.nameTranslations,
    descriptionTranslations: category.descriptionTranslations,
    categoryClass,
    grouped: category.grouped,
    stats: ranked.stats
      ? {
          tokenCount: ranked.stats.tokenCount,
          priceChange24hPct: ranked.stats.priceChange24hPct,
          volume1h: ranked.stats.volume1h,
          volume1d: ranked.stats.volume1d,
          volume1w: ranked.stats.volume1w,
          volume1m: ranked.stats.volume1m,
          volume1y: ranked.stats.volume1y,
          fdv: ranked.stats.fdv,
          marketCap: ranked.stats.marketCap,
        }
      : undefined,
    topTokens: ranked.topTokens.map((token) => ({
      chainId: token.chainId,
      address: token.address,
      symbol: token.symbol,
      logoUrl: token.logoUrl,
    })),
    topGroups: ranked.topGroups.map((group) => ({
      id: group.id,
      displayName: group.displayName,
      ticker: group.ticker,
      logoUrl: group.logoUrl,
    })),
  }
}

/**
 * Every response carries all locales, so the cache stays language-free and the query hooks apply
 * this in `select`. The English fields are the fallback for a locale the backend has no copy for.
 */
export function localizeTokenCategory(category: TokenCategory, language: Language): TokenCategory {
  const name = getTranslation(category.nameTranslations, language)
  const description = getTranslation(category.descriptionTranslations, language)
  if (name === undefined && description === undefined) {
    return category
  }
  return { ...category, name: name ?? category.name, description: description ?? category.description }
}

/** Proto timestamps are unix seconds (bucket start); ChartPoint uses ms epoch. */
export function timeSeriesToChartPoints(series: TimeSeriesPoint[]): ChartPoint[] {
  return series.map((point) => ({ timestamp: Number(point.timestamp) * 1000, value: point.value }))
}

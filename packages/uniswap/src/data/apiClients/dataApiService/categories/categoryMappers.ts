import {
  type Category as CategoryMessage,
  CategoryClass,
  CategoryKind as CategoryKindMessage,
  type RankedCategory,
  type RankedPoolCategory,
  type TimeSeriesPoint,
} from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import { TokensOrderBy, type TokensSort } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { ChartPoint } from 'uniswap/src/components/charts/computeChartPaths'
import type { Language } from 'uniswap/src/features/language/constants'
import { getTranslation } from 'uniswap/src/features/language/getTranslation'
import {
  type CategoryBase,
  type CategoryKind,
  type PoolCategory,
  type TokenCategory,
  TokenCategoryClass,
  type TokenCategoryDefaultSort,
} from 'uniswap/src/features/tokenCategories/types'
import { logger } from 'utilities/src/logger/logger'

const CATEGORY_CLASS_BY_PROTO: Partial<Record<CategoryClass, TokenCategoryClass>> = {
  [CategoryClass.MARKET]: TokenCategoryClass.Market,
  [CategoryClass.ASSET]: TokenCategoryClass.Asset,
  [CategoryClass.SECTOR]: TokenCategoryClass.Sector,
}

function toTokenCategoryDefaultSort(sort: TokensSort | undefined): TokenCategoryDefaultSort | undefined {
  if (sort?.orderBy === undefined || sort.orderBy === TokensOrderBy.UNSPECIFIED) {
    return undefined
  }
  return { orderBy: sort.orderBy, ascending: sort.ascending ?? false }
}

// A category that carries no kind is a token category (proto contract).
const CATEGORY_KIND_BY_PROTO: Record<CategoryKindMessage, CategoryKind> = {
  [CategoryKindMessage.UNSPECIFIED]: 'token',
  [CategoryKindMessage.TOKEN]: 'token',
  [CategoryKindMessage.POOL]: 'pool',
}

/**
 * The identity fields every kind shares. Each ranked wrapper is kind-specific, so the caller states
 * the kind it expects and a category served under the wrong wrapper is dropped rather than mis-typed.
 */
function mapCategoryBase<K extends CategoryKind>({
  category,
  expectedKind,
}: {
  category: CategoryMessage
  expectedKind: K
}): (CategoryBase & { kind: K }) | undefined {
  const categoryClass = CATEGORY_CLASS_BY_PROTO[category.class]
  const kind = CATEGORY_KIND_BY_PROTO[category.kind]
  if (!categoryClass || kind !== expectedKind) {
    logger.warn('categoryMappers', 'mapCategoryBase', 'Dropping category with unmapped class or kind', {
      id: category.id,
      class: category.class,
      kind: category.kind,
      expectedKind,
    })
    return undefined
  }

  return {
    id: category.id,
    kind: expectedKind,
    name: category.name,
    englishName: category.name,
    description: category.description,
    nameTranslations: category.nameTranslations,
    descriptionTranslations: category.descriptionTranslations,
    categoryClass,
  }
}

export function rankedCategoryToTokenCategory(ranked: RankedCategory): TokenCategory | undefined {
  const category = ranked.category
  const base = category && mapCategoryBase({ category, expectedKind: 'token' })
  if (!category || !base) {
    return undefined
  }

  return {
    ...base,
    grouped: category.grouped,
    defaultSort: toTokenCategoryDefaultSort(category.defaultSort),
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

export function rankedPoolCategoryToPoolCategory(ranked: RankedPoolCategory): PoolCategory | undefined {
  const category = ranked.category
  const base = category && mapCategoryBase({ category, expectedKind: 'pool' })
  if (!category || !base) {
    return undefined
  }

  return {
    ...base,
    stats: ranked.stats
      ? {
          poolCount: ranked.stats.poolCount,
          tvl: ranked.stats.tvl,
          volume1d: ranked.stats.volume1d,
          volume1w: ranked.stats.volume1w,
          volume1m: ranked.stats.volume1m,
          fees1d: ranked.stats.fees1d,
          tvlChange24hPct: ranked.stats.tvlChange24hPct,
          volumeChange24hPct: ranked.stats.volumeChange24hPct,
          avgApr: ranked.stats.avgApr,
        }
      : undefined,
    topPools: ranked.topPools.map((pool) => ({
      chainId: pool.chainId,
      poolId: pool.poolId,
      token0Symbol: pool.token0Symbol,
      token0LogoUrl: pool.token0LogoUrl,
      token1Symbol: pool.token1Symbol,
      token1LogoUrl: pool.token1LogoUrl,
      protocolVersion: pool.protocolVersion,
      feeTier: pool.feeTier,
    })),
  }
}

/**
 * Every response carries all locales, so the cache stays language-free and the query hooks apply
 * this in `select`. The English fields are the fallback for a locale the backend has no copy for.
 */
export function localizeCategory<T extends CategoryBase>(category: T, language: Language): T {
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

import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { RwaCategory as RwaCategoryEnum } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

export const RWA_EXPLORE_CATEGORIES = [
  ExploreCategory.Stocks,
  ExploreCategory.Commodities,
  ExploreCategory.Etfs,
] as const satisfies readonly ExploreCategory[]

export type RwaExploreCategory = (typeof RWA_EXPLORE_CATEGORIES)[number]

/** Explore categories backed by ListRankedRwas (grouped ticker rows). */
export const RANKED_RWA_EXPLORE_CATEGORIES = [
  ExploreCategory.Stocks,
  ExploreCategory.Etfs,
] as const satisfies readonly RwaExploreCategory[]

export type RankedRwaExploreCategory = (typeof RANKED_RWA_EXPLORE_CATEGORIES)[number]

const EXPLORE_TO_RANKED_RWA_CATEGORY: Record<RankedRwaExploreCategory, RwaCategory> = {
  [ExploreCategory.Stocks]: RwaCategoryEnum.STOCKS,
  [ExploreCategory.Etfs]: RwaCategoryEnum.ETFS,
}

export function isRwaExploreCategory(category: ExploreCategory): category is RwaExploreCategory {
  return (RWA_EXPLORE_CATEGORIES as readonly ExploreCategory[]).includes(category)
}

export function isRankedRwaExploreCategory(category: ExploreCategory): category is RankedRwaExploreCategory {
  return (RANKED_RWA_EXPLORE_CATEGORIES as readonly ExploreCategory[]).includes(category)
}

export function exploreCategoryToRankedRwaCategory(category: RankedRwaExploreCategory): RwaCategory {
  return EXPLORE_TO_RANKED_RWA_CATEGORY[category]
}

import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getGroupedRwaCategory, isGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { ExploreCategory } from '~/features/Explore/categories/useExploreCategory'

/** Static category ids: the deep-link set, and the grouped set until the BE list says otherwise. */
export const GROUPED_EXPLORE_CATEGORIES = [
  ExploreCategory.Stocks,
  ExploreCategory.Commodities,
  ExploreCategory.Etfs,
] as const satisfies readonly ExploreCategory[]

// The bridge ids and the static grouped ids are the same slugs by contract; this map is the
// loading/failed-fetch detection path, derived from the bridge so the two can't drift.
const RWA_CATEGORY_BY_STATIC_ID = new Map(
  Object.entries(RWA_CATEGORY_IDS).map(([rwaCategory, id]) => [id, Number(rwaCategory) as RwaCategory]),
)

/**
 * Resolves which table the selected Explore category renders: the grouped RwaCategory, or UNSPECIFIED for the
 * flat token list. A fetched category follows the BE's `grouped` flag; ids missing from the list (failed fetch,
 * static deep links) fall back to the static grouped set. While the first fetch is in flight, a static id the FE
 * can't render grouped (Commodities) resolves flat so the table doesn't mount v1 and flip once the list lands.
 */
export function resolveGroupedRwaCategory({
  categoryId,
  categories,
  categoriesPending = false,
}: {
  categoryId: string
  categories: TokenCategory[]
  categoriesPending?: boolean
}): RwaCategory {
  const match = categories.find((category) => category.id === categoryId)
  if (match) {
    return getGroupedRwaCategory(match)
  }
  const staticCategory = RWA_CATEGORY_BY_STATIC_ID.get(categoryId) ?? RwaCategory.UNSPECIFIED
  if (categoriesPending && !isGroupedRwaCategory(staticCategory)) {
    return RwaCategory.UNSPECIFIED
  }
  return staticCategory
}

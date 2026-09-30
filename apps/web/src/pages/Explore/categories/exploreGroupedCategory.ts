import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getGroupedRwaCategory, isGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { ExploreCategory } from '~/pages/Explore/categories/useExploreCategory'

/** Static (flag-off) category ids: the deep-link set, and the grouped set until the BE list says otherwise. */
export const GROUPED_EXPLORE_CATEGORIES = [
  ExploreCategory.Stocks,
  ExploreCategory.Commodities,
  ExploreCategory.Etfs,
] as const satisfies readonly ExploreCategory[]

// The bridge ids and the static grouped ids are the same slugs by contract; this map is the
// flag-off/loading detection path, derived from the bridge so the two can't drift.
const RWA_CATEGORY_BY_STATIC_ID = new Map(
  Object.entries(RWA_CATEGORY_IDS).map(([rwaCategory, id]) => [id, Number(rwaCategory) as RwaCategory]),
)

/**
 * Resolves which table the selected Explore category renders: the grouped RwaCategory, or UNSPECIFIED for the
 * flat token list. A fetched category follows the BE's `grouped` flag; ids missing from the list (flag off,
 * static deep links) fall back to the static grouped set. While the first fetch is in flight, a static id the
 * FE can't render grouped (Commodities) resolves flat so the table doesn't mount v1 and flip once the list lands.
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

/**
 * The RwaCategory whose legal disclaimer the selected category shows. Deliberately id-based rather than
 * `grouped`-based: the BE flipping how Stocks/ETFs render must never drop legal copy without an FE change.
 */
export function resolveRwaDisclaimerCategory(categoryId: string): RwaCategory {
  return RWA_CATEGORY_BY_STATIC_ID.get(categoryId) ?? RwaCategory.UNSPECIFIED
}

/**
 * Stocks and ETFs carry the legal disclaimer; Commodities and flat categories don't. Kept separate
 * from isGroupedRwaCategory so narrowing that for an endpoint migration can't drop legal copy.
 */
export function showsRwaDisclaimer(rwaCategory: RwaCategory): boolean {
  return rwaCategory === RwaCategory.STOCKS || rwaCategory === RwaCategory.ETFS
}

/**
 * Flat categories always sort by the selected volume window. Grouped categories only do once the
 * token categories flag routes them to the v2 sources, since v1 ListRankedRwas/ListRwaTokens serve 1D only.
 */
export function showsVolumeTimeFrameSelector({
  rwaCategory,
  tokenCategoriesEnabled,
}: {
  rwaCategory: RwaCategory
  tokenCategoriesEnabled: boolean
}): boolean {
  return tokenCategoriesEnabled || rwaCategory === RwaCategory.UNSPECIFIED
}

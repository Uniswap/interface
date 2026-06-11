import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'

/** When an asset has multiple categories, the highest-priority present wins, so the tag is stable regardless of
 *  backend array order. */
const RWA_CATEGORY_TAG_PRIORITY: readonly RwaCategory[] = [RwaCategory.STOCKS, RwaCategory.ETFS]

/** Picks the tag category from an RWA's `categories` by `RWA_CATEGORY_TAG_PRIORITY`; returns UNSPECIFIED when none
 *  are classified, so no tag renders. */
export function getRwaTagCategory({ categories }: { categories?: RwaCategory[] }): RwaCategory {
  const present = new Set(categories)
  return RWA_CATEGORY_TAG_PRIORITY.find((category) => present.has(category)) ?? RwaCategory.UNSPECIFIED
}
